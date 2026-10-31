'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@supabase/ssr'
import { getAdminSupabase } from '@/lib/supabase-admin'

const MAX_GUESTS = 20
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export async function saveGuests(
  inviteId: string,
  guests: { name: string; email: string }[]
): Promise<{ ok: boolean; message: string }> {
  const cleaned = guests
    .map((g) => ({
      name: g.name.trim().slice(0, 80),
      email: g.email.trim().toLowerCase().slice(0, 200),
    }))
    .filter((g) => g.name || g.email)

  if (cleaned.length === 0) return { ok: false, message: 'Add at least one guest.' }
  for (const g of cleaned) {
    if (!g.name) return { ok: false, message: 'Every guest needs a name.' }
    if (!emailOk(g.email)) return { ok: false, message: `"${g.email}" is not a valid email.` }
  }
  if (new Set(cleaned.map((g) => g.email)).size !== cleaned.length) {
    return { ok: false, message: 'The same email is listed twice.' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { ok: false, message: 'Please log in again.' }

  // Row level security only returns this invite if it belongs to the logged-in host
  const { data: invite } = await supabase
    .from('invites')
    .select('id')
    .eq('id', inviteId)
    .maybeSingle()
  if (!invite) return { ok: false, message: 'Invite not found.' }

  const admin = getAdminSupabase()
  const { data: existing, error: readError } = await admin
    .from('guests')
    .select('email')
    .eq('invite_id', inviteId)
  if (readError) return { ok: false, message: 'Could not read the guest list.' }

  const existingEmails = new Set((existing ?? []).map((g) => g.email))
  const fresh = cleaned.filter((g) => !existingEmails.has(g.email))

  if (fresh.length === 0) return { ok: false, message: 'Those guests are already on the list.' }
  if (existingEmails.size + fresh.length > MAX_GUESTS) {
    return {
      ok: false,
      message: `Limit is ${MAX_GUESTS} guests. You have ${existingEmails.size}, so you can add ${MAX_GUESTS - existingEmails.size} more.`,
    }
  }

  const { error } = await admin
    .from('guests')
    .insert(fresh.map((g) => ({ invite_id: inviteId, name: g.name, email: g.email })))
  if (error) return { ok: false, message: 'Saving failed. Try again.' }

  revalidatePath(`/dashboard/${inviteId}`)
  return { ok: true, message: `Added ${fresh.length} guest(s).` }
}