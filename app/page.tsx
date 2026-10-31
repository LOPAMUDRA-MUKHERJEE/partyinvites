  //  import LoginButton from './LoginButton'
  //  export default function Home() {
  //    return <main style={{ padding: 40 }}><LoginButton /></main>
  //  }

import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-server'
import LoginButton from './LoginButton'

export default async function Home() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return <main style={{ padding: 40 }}><LoginButton /></main>
}