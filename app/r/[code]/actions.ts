'use server'

import { getAdminSupabase } from '../../../lib/supabase-admin'
import { replyState } from '../../../lib/event'

export async function saveReply(
  code: string,
  reply: string
): Promise<{ ok: boolean; message: string; closed?: boolean }> {
  if (reply !== 'yes' && reply !== 'no') {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
  if (typeof code !== 'string' || code.length < 10 || code.length > 100) {
    return { ok: false, message: 'This link is not valid.' }
  }

  const admin = getAdminSupabase()

  const { data: guest } = await admin
    .from('guests')
    .select('id, invite_id')
    .eq('reply_code', code)
    .maybeSingle()
  if (!guest) return { ok: false, message: 'This link is not valid.' }

  const { data: invite } = await admin
    .from('invites')
    .select('status, event_at, rsvp_cutoff_days')
    .eq('id', guest.invite_id)
    .maybeSingle()
  if (!invite) return { ok: false, message: 'This link is not valid.' }

  // The lock lives here, on the server, so it cannot be skipped from the browser
  const state = replyState(invite)
  if (!state.open) {
    return {
      ok: false,
      closed: true,
      message:
        state.reason === 'cancelled'
          ? 'This event has been cancelled.'
          : 'Replies for this event are closed, so your reply was not recorded.',
    }
  }

  const { data, error } = await admin
    .from('guests')
    .update({ reply })
    .eq('id', guest.id)
    .select('id')

  if (error || !data || data.length === 0) {
    return { ok: false, message: 'Could not save your reply. Please try again.' }
  }
  return { ok: true, message: 'Thank you! Your reply is saved.' }
}









// 'use server'

// import { getAdminSupabase } from '../../../lib/supabase-admin'

// export async function saveReply(code: string, reply: string) {
//   if (!['yes', 'no', 'maybe'].includes(reply)) {
//     return { ok: false, message: 'Something went wrong. Please try again.' }
//   }
//   if (typeof code !== 'string' || code.length < 10 || code.length > 100) {
//     return { ok: false, message: 'This link is not valid.' }
//   }

//   const admin = getAdminSupabase()
//   const { data, error } = await admin
//     .from('guests')
//     .update({ reply })
//     .eq('reply_code', code)
//     .select('id')

//   if (error || !data || data.length === 0) {
//     return { ok: false, message: 'Could not save your reply. Please try again.' }
//   }
//   return { ok: true, message: 'Thank you! Your reply is saved.' }
// }