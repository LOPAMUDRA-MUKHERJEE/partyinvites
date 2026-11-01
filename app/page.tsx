  //  import LoginButton from './LoginButton'
  //  export default function Home() {
  //    return <main style={{ padding: 40 }}><LoginButton /></main>
  //  }

// import { redirect } from 'next/navigation'
// import { getSupabase } from '@/lib/supabase-server'
// import LoginButton from './LoginButton'

// export default async function Home() {
//   const supabase = await getSupabase()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (user) redirect('/dashboard')
//   return <main style={{ padding: 40 }}><LoginButton /></main>
// }


import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-server'
import LoginButton from './LoginButton'

export default async function Home() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main style={{ background: '#fff8ec', color: '#2b1b0e', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: '0 0 12px' }}>
          Send Diwali invites from your own Gmail
        </h1>
        <p style={{ color: '#6b5a48', margin: '0 0 24px', lineHeight: 1.5 }}>
          Write the invite, add up to 20 guests, and send each one a personal email from your Gmail.
          Guests reply Yes, No or Maybe through a private link.
        </p>
        <LoginButton />
        <p style={{ color: '#6b5a48', fontSize: 14, marginTop: 20, lineHeight: 1.5 }}>
          Live demo, invite-only testing. If Google shows an “unverified app” warning, choose
          Advanced, then Go to partyinvites. Only approved test users can log in.
        </p>
      </div>
    </main>
  )
}