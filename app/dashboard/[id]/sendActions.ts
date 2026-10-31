'use server'

import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { decrypt } from '@/lib/crypto'
import { getAccessToken, sendGmail, ReauthNeeded } from '@/lib/gmail'

export async function sendInvites(inviteId: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Please log in again.' }

  // Row level security: only returns the invite if it belongs to this host
  const { data: invite } = await supabase
    .from('invites')
    .select('*')
    .eq('id', inviteId)
    .maybeSingle()
  if (!invite) return { ok: false, message: 'Invite not found.' }

  const site = process.env.SITE_URL?.replace(/\/$/, '')
  if (!site) return { ok: false, message: 'SITE_URL is missing in .env.local.' }

  const admin = getAdminSupabase()
  const { data: tokenRow } = await admin
    .from('host_tokens')
    .select('encrypted_refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!tokenRow) {
    return { ok: false, message: 'Please log out and log in again, so Google can give permission to send.' }
  }

  let accessToken: string
  try {
    accessToken = await getAccessToken(decrypt(tokenRow.encrypted_refresh_token))
  } catch (e) {
    if (e instanceof ReauthNeeded) {
      return { ok: false, message: 'Google access has expired. Please log out and log in again, then try sending.' }
    }
    console.error('Token step failed:', e)
    return { ok: false, message: 'Could not connect to Gmail. Nothing was sent.' }
  }

  // Claim the guests first, so a double click cannot send twice
  const { data: claimed, error: claimError } = await admin
    .from('guests')
    .update({ status: 'sending' })
    .eq('invite_id', inviteId)
    .in('status', ['not_sent', 'failed'])
    .select('id, name, email, reply_code')
  if (claimError) return { ok: false, message: 'Could not start sending.' }
  if (!claimed || claimed.length === 0) return { ok: false, message: 'Nobody left to send to.' }

  let sent = 0
  let failed = 0
  for (const g of claimed) {
    const { data: row } = await admin.from('outbox').insert({ guest_id: g.id }).select('id').single()
    try {
      const body = [
        `Hi ${g.name},`,
        '',
        invite.message,
        '',
        `When: ${invite.event_date} at ${invite.event_time}`,
        `Where: ${invite.venue}`,
        '',
        'Please tell us if you can come. This link is only for you:',
        `${site}/r/${g.reply_code}`,
        '',
        `– ${invite.host_name}`,
      ].join('\n')
      await sendGmail(accessToken, g.email, `${invite.host_name} invites you to Diwali`, body)
      if (row) {
        await admin.from('outbox').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', row.id)
      }
      await admin.from('guests').update({ status: 'sent' }).eq('id', g.id)
      sent++
    } catch (e) {
      console.error('Send failed for guest', g.id, e)
      if (row) {
        await admin.from('outbox').update({ status: 'failed', error: String(e).slice(0, 300) }).eq('id', row.id)
      }
      await admin.from('guests').update({ status: 'failed' }).eq('id', g.id)
      failed++
    }
  }

  revalidatePath(`/dashboard/${inviteId}`)
  return {
    ok: failed === 0,
    message: failed === 0 ? `Sent ${sent} invite(s).` : `Sent ${sent}, failed ${failed}. You can press Send again to retry the failed ones.`,
  }
}