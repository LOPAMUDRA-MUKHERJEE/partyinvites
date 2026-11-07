'use server'

import { revalidatePath } from 'next/cache'
import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { decrypt } from '@/lib/crypto'
import { getAccessToken, sendGmail, ReauthNeeded } from '@/lib/gmail'

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

// Cancels the event (if it is not cancelled yet) and emails everyone who was sent the invite.
// Safe to call again: it only emails guests who have not been told yet.
export async function cancelEvent(
  inviteId: string,
  reasonInput: string
): Promise<{ ok: boolean; message: string }> {
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

  const admin = getAdminSupabase()
  const alreadyCancelled = invite.status === 'cancelled'
  const reason = alreadyCancelled
    ? String(invite.cancel_reason ?? '')
    : oneLine(String(reasonInput ?? '')).slice(0, 140)

  // Cancel first, so replies stop immediately even if Gmail is not working
  if (!alreadyCancelled) {
    const { error } = await admin
      .from('invites')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: reason || null })
      .eq('id', inviteId)
      .eq('status', 'active')
    if (error) return { ok: false, message: 'Could not cancel the event. Nothing was changed.' }
  }
  revalidatePath(`/dashboard/${inviteId}`)
  revalidatePath('/dashboard')

  const notEmailed =
    'The event is cancelled and replies are closed, but the cancellation emails were NOT sent because Gmail access is missing or expired. Log out, log in again, then press "Send cancellation emails".'

  const { data: tokenRow } = await admin
    .from('host_tokens')
    .select('encrypted_refresh_token')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!tokenRow) return { ok: false, message: notEmailed }

  let accessToken: string
  try {
    accessToken = await getAccessToken(decrypt(tokenRow.encrypted_refresh_token))
  } catch (e) {
    if (e instanceof ReauthNeeded) return { ok: false, message: notEmailed }
    console.error('Token step failed:', e)
    return {
      ok: false,
      message: 'The event is cancelled, but Gmail could not be reached, so no emails were sent. Press "Send cancellation emails" to try again.',
    }
  }

  // Claim the guests first, so a double click cannot email anyone twice.
  // Only guests who were actually sent the invite get the cancellation.
  const { data: claimed, error: claimError } = await admin
    .from('guests')
    .update({ cancel_sent_at: new Date().toISOString() })
    .eq('invite_id', inviteId)
    .eq('status', 'sent')
    .is('cancel_sent_at', null)
    .select('id, name, email')
  if (claimError) {
    return { ok: false, message: 'The event is cancelled, but the emails could not be started. Try "Send cancellation emails" again.' }
  }
  if (!claimed || claimed.length === 0) {
    return {
      ok: true,
      message: alreadyCancelled
        ? 'Everyone who got the invite has already been told.'
        : 'Event cancelled. No invites had been sent, so there was nobody to email.',
    }
  }

  let sent = 0
  let failed = 0
  for (const g of claimed) {
    try {
      const body = [
        `Hi ${g.name},`,
        '',
        `${invite.host_name} has cancelled the event planned for ${invite.event_date} at ${invite.event_time}, ${invite.venue}.`,
        ...(reason ? ['', `Reason: ${reason}`] : []),
        '',
        'Your invite link no longer accepts replies.',
        '',
        `– ${invite.host_name}`,
      ].join('\n')
      await sendGmail(accessToken, g.email, `Cancelled: ${invite.host_name}'s Diwali on ${invite.event_date}`, body)
      sent++
    } catch (e) {
      console.error('Cancellation email failed for guest', g.id, e)
      // Release the claim so this guest is retried next time
      await admin.from('guests').update({ cancel_sent_at: null }).eq('id', g.id)
      failed++
    }
  }

  revalidatePath(`/dashboard/${inviteId}`)
  return {
    ok: failed === 0,
    message:
      failed === 0
        ? `Event cancelled. Emailed ${sent} guest(s).`
        : `Event cancelled. Emailed ${sent}, failed ${failed}. Press "Send cancellation emails" to retry the failed ones.`,
  }
}