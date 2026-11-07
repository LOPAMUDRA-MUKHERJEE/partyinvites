import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { decrypt } from '@/lib/crypto'
import { getAccessToken, sendGmail, ReauthNeeded } from '@/lib/gmail'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// Tomorrow's date in IST as "YYYY-MM-DD"
function tomorrowInIST(): string {
  const ist = new Date(Date.now() + IST_OFFSET_MS)
  ist.setUTCDate(ist.getUTCDate() + 1)
  return ist.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  // Vercel sends "Authorization: Bearer <CRON_SECRET>" on cron calls
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ?date=YYYY-MM-DD lets you test without waiting (still needs the secret)
  const override = new URL(request.url).searchParams.get('date')
  const target = override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : tomorrowInIST()

  const admin = getAdminSupabase()
  const { data: invites, error: invitesError } = await admin
    .from('invites')
    .select('id, host_id, host_name, event_date, event_time, venue')
    .eq('status', 'active')
    .eq('event_date', target)
  if (invitesError) {
    console.error('Reminder cron: could not read invites', invitesError)
    return NextResponse.json({ error: 'could not read invites' }, { status: 500 })
  }

  // One token lookup per host, even if they have several invites that day
  const tokens = new Map<string, string | null>() // host_id -> access token, or null if unusable
  const skipped: { invite: string; reason: string }[] = []
  let sent = 0
  let failed = 0

  for (const invite of invites ?? []) {
    let accessToken = tokens.get(invite.host_id)

    if (accessToken === undefined) {
      const { data: row } = await admin
        .from('host_tokens')
        .select('encrypted_refresh_token, needs_reauth')
        .eq('user_id', invite.host_id)
        .maybeSingle()

      if (!row) {
        accessToken = null
        skipped.push({ invite: invite.id, reason: 'no token saved' })
      } else if (row.needs_reauth) {
        accessToken = null
        skipped.push({ invite: invite.id, reason: 'host must reconnect Gmail' })
      } else {
        try {
          accessToken = await getAccessToken(decrypt(row.encrypted_refresh_token))
        } catch (e) {
          accessToken = null
          if (e instanceof ReauthNeeded) {
            await admin.from('host_tokens').update({ needs_reauth: true }).eq('user_id', invite.host_id)
            skipped.push({ invite: invite.id, reason: 'token expired, flagged for reconnect' })
          } else {
            console.error('Reminder cron: token step failed for host', invite.host_id, e)
            skipped.push({ invite: invite.id, reason: 'could not reach Google' })
          }
        }
      }
      tokens.set(invite.host_id, accessToken)
    }

    if (!accessToken) continue

    // Claim first, so an overlapping or repeated run cannot email anyone twice
    const { data: claimed, error: claimError } = await admin
      .from('guests')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('invite_id', invite.id)
      .eq('status', 'sent')
      .eq('reply', 'yes')
      .is('reminder_sent_at', null)
      .select('id, name, email')
    if (claimError) {
      console.error('Reminder cron: claim failed for invite', invite.id, claimError)
      skipped.push({ invite: invite.id, reason: 'claim failed' })
      continue
    }

    for (const g of claimed ?? []) {
      try {
        const body = [
          `Hi ${g.name},`,
          '',
          `A quick reminder that ${invite.host_name}'s Diwali is tomorrow.`,
          '',
          `When: ${invite.event_date} at ${invite.event_time}`,
          `Where: ${invite.venue}`,
          '',
          'You said you can come. See you there!',
          '',
          `– ${invite.host_name}`,
        ].join('\n')
        await sendGmail(accessToken, g.email, `Reminder: ${invite.host_name}'s Diwali is tomorrow`, body)
        sent++
      } catch (e) {
        console.error('Reminder failed for guest', g.id, e)
        // Release the claim so a later run can retry this guest
        await admin.from('guests').update({ reminder_sent_at: null }).eq('id', g.id)
        failed++
      }
    }
  }

  const result = { date: target, invites: invites?.length ?? 0, sent, failed, skipped }
  console.log('Reminder cron result', JSON.stringify(result))
  return NextResponse.json(result)
}