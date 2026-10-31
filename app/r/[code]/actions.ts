'use server'

import { getAdminSupabase } from '../../../lib/supabase-admin'

export async function saveReply(code: string, reply: string) {
  if (!['yes', 'no', 'maybe'].includes(reply)) {
    return { ok: false, message: 'Something went wrong. Please try again.' }
  }
  if (typeof code !== 'string' || code.length < 10 || code.length > 100) {
    return { ok: false, message: 'This link is not valid.' }
  }

  const admin = getAdminSupabase()
  const { data, error } = await admin
    .from('guests')
    .update({ reply })
    .eq('reply_code', code)
    .select('id')

  if (error || !data || data.length === 0) {
    return { ok: false, message: 'Could not save your reply. Please try again.' }
  }
  return { ok: true, message: 'Thank you! Your reply is saved.' }
}