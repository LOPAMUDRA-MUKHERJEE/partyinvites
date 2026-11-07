import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import LogoutButton from './LogoutButton'
import LoginButton from '../LoginButton'

const MAX_GUESTS = 20

const C = {
  page: '#f1e3c8',
  text: '#2b1b0e',
  muted: '#5e4d3a',
  card: '#fbf3e2',
  border: '#dcc59a',
  orange: '#c2570c',
}

const buttonStyle = {
  display: 'inline-block',
  background: C.orange,
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
} as const

function prettyDate(d: string) {
  const parsed = new Date(`${d}T00:00:00Z`)
  if (isNaN(parsed.getTime())) return d
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

type Stats = { total: number; sent: number; yes: number; no: number; waiting: number }

export default async function Dashboard() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: invites } = await supabase
    .from('invites')
    .select('id, host_name, event_date, event_time, venue, status')
    .order('created_at', { ascending: false })
  const list = invites ?? []

  const tokenAdmin = getAdminSupabase()
  const { data: tokenRow } = await tokenAdmin
    .from('host_tokens')
    .select('needs_reauth')
    .eq('user_id', user.id)
    .maybeSingle()
  const needsReauth = tokenRow?.needs_reauth === true
  // Guest counts. The guests table has no policies, so this uses the admin client,
  // but only for invite ids that the login-checked query above returned.
  const stats: Record<string, Stats> = {}
  if (list.length > 0) {
    const admin = getAdminSupabase()
    const { data: guests } = await admin
      .from('guests')
      .select('invite_id, status, reply')
      .in('invite_id', list.map((i) => i.id))
    for (const g of guests ?? []) {
      const s = (stats[g.invite_id] ??= { total: 0, sent: 0, yes: 0, no: 0, waiting: 0 })
      s.total++
      if (g.status === 'sent') s.sent++
      if (g.reply === 'yes') s.yes++
      else if (g.reply === 'no') s.no++
      else s.waiting++
    }
  }

  return (
    <main style={{ background: C.page, color: C.text, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ textAlign: 'right', marginBottom: 12 }}>
          <LogoutButton />
        </div>
                {needsReauth && (
          <div style={{ border: '1px solid #9b1c1c', borderRadius: 10, padding: '12px 14px', margin: '0 0 20px', background: C.card }}>
            <b style={{ color: '#9b1c1c' }}>Gmail is disconnected.</b>
            <div style={{ margin: '4px 0 12px', fontSize: 14 }}>
              Reminder emails could not be sent. Reconnect so your guests get their reminders.
            </div>
            <LoginButton />
          </div>
        )}
        <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: '0 0 8px' }}>
          Send Diwali invites from your own Gmail
        </h1>
        <p style={{ color: C.muted, margin: '0 0 24px' }}>Your invites</p>

        <Link href="/dashboard/new" style={buttonStyle}>+ New invite</Link>

        {list.length === 0 ? (
          <p style={{ marginTop: 32, color: C.muted }}>
            No invites yet. Press the button above to make your first one.
          </p>
        ) : (
          <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
            {list.map((i) => {
              const s = stats[i.id] ?? { total: 0, sent: 0, yes: 0, no: 0, waiting: 0 }
              return (
                <div
                  key={i.id}
                  style={{
                    background: C.card,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: 20,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    {prettyDate(i.event_date)} · {i.event_time}
                  </div>
                  <div style={{ marginTop: 4 }}>{i.venue}</div>
                  <div style={{ marginTop: 2, color: C.muted, fontSize: 14 }}>
                    Hosted by {i.host_name}
                  </div>
                  {i.status === 'cancelled' && (
                    <div style={{ marginTop: 8, color: '#9b1c1c', fontWeight: 700 }}>Cancelled</div>
                  )}

                  <div style={{ marginTop: 14, fontWeight: 600 }}>
                    {s.total} of {MAX_GUESTS} guests added · {s.sent} sent
                  </div>
                  {s.total > 0 && (
                    <div style={{ marginTop: 2, color: C.muted, fontSize: 14 }}>
                      {s.yes} yes · {s.no} no · {s.waiting} waiting
                    </div>
                  )}

                  <div style={{ marginTop: 16 }}>
                    <Link href={`/dashboard/${i.id}`} style={buttonStyle}>Open</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}



















//..........................................................................................

// import Link from 'next/link'
// import { redirect } from 'next/navigation'
// import { getSupabase } from '@/lib/supabase-server'
// import { getAdminSupabase } from '@/lib/supabase-admin'
// import LogoutButton from './LogoutButton'

// const MAX_GUESTS = 20

// const C = {
//   page: '#d4c29d',
//   text: '#2b1b0e',
//   muted: '#5e4d3a',
//   card: '#fbf3e2',
//   border: '#dcc59a',
//   orange: '#c2570c',
// }

// const buttonStyle = {
//   display: 'inline-block',
//   background: C.orange,
//   color: '#ffffff',
//   padding: '10px 18px',
//   borderRadius: 8,
//   textDecoration: 'none',
//   fontWeight: 600,
// } as const

// function prettyDate(d: string) {
//   const parsed = new Date(`${d}T00:00:00Z`)
//   if (isNaN(parsed.getTime())) return d
//   return parsed.toLocaleDateString('en-IN', {
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//     timeZone: 'UTC',
//   })
// }

// type Stats = { total: number; sent: number; yes: number; maybe: number; no: number; waiting: number }

// export default async function Dashboard() {
//   const supabase = await getSupabase()
//   const { data: { user } } = await supabase.auth.getUser()
//   if (!user) redirect('/')

//   const { data: invites } = await supabase
//     .from('invites')
//     .select('id, host_name, event_date, event_time, venue')
//     .order('created_at', { ascending: false })
//   const list = invites ?? []

//   // Guest counts. The guests table has no policies, so this uses the admin client,
//   // but only for invite ids that the login-checked query above returned.
//   const stats: Record<string, Stats> = {}
//   if (list.length > 0) {
//     const admin = getAdminSupabase()
//     const { data: guests } = await admin
//       .from('guests')
//       .select('invite_id, status, reply')
//       .in('invite_id', list.map((i) => i.id))
//     for (const g of guests ?? []) {
//       const s = (stats[g.invite_id] ??= { total: 0, sent: 0, yes: 0, maybe: 0, no: 0, waiting: 0 })
//       s.total++
//       if (g.status === 'sent') s.sent++
//       if (g.reply === 'yes') s.yes++
//       else if (g.reply === 'maybe') s.maybe++
//       else if (g.reply === 'no') s.no++
//       else s.waiting++
//     }
//   }

//   return (
//     <main style={{ background: C.page, color: C.text, minHeight: '100vh', padding: '40px 20px' }}>
//       <div style={{ maxWidth: 560, margin: '0 auto' }}>
//         <div style={{ textAlign: 'right', marginBottom: 12 }}>
//              <LogoutButton />
//            </div>
//         <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: '0 0 8px' }}>
//           Send Diwali invites from your own Gmail
//         </h1>
//         <p style={{ color: C.muted, margin: '0 0 24px' }}>Your invites</p>

//         <Link href="/dashboard/new" style={buttonStyle}>+ New invite</Link>

//         {list.length === 0 ? (
//           <p style={{ marginTop: 32, color: C.muted }}>
//             No invites yet. Press the button above to make your first one.
//           </p>
//         ) : (
//           <div style={{ marginTop: 32, display: 'grid', gap: 16 }}>
//             {list.map((i) => {
//               const s = stats[i.id] ?? { total: 0, sent: 0, yes: 0, maybe: 0, no: 0, waiting: 0 }
//               return (
//                 <div
//                   key={i.id}
//                   style={{
//                     background: C.card,
//                     border: `1px solid ${C.border}`,
//                     borderRadius: 12,
//                     padding: 20,
//                   }}
//                 >
//                   <div style={{ fontWeight: 700, fontSize: 18 }}>
//                     {prettyDate(i.event_date)} · {i.event_time}
//                   </div>
//                   <div style={{ marginTop: 4 }}>{i.venue}</div>
//                   <div style={{ marginTop: 2, color: C.muted, fontSize: 14 }}>
//                     Hosted by {i.host_name}
//                   </div>

//                   <div style={{ marginTop: 14, fontWeight: 600 }}>
//                     {s.total} of {MAX_GUESTS} guests added · {s.sent} sent
//                   </div>
//                   {s.total > 0 && (
//                     <div style={{ marginTop: 2, color: C.muted, fontSize: 14 }}>
//                       {s.yes} yes · {s.maybe} maybe · {s.no} no · {s.waiting} waiting
//                     </div>
//                   )}

//                   <div style={{ marginTop: 16 }}>
//                     <Link href={`/dashboard/${i.id}`} style={buttonStyle}>Open</Link>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}
//       </div>
//     </main>
//   )
// } 
 
 
 
 //..................................................................................................................
 
 
 //  import { redirect } from 'next/navigation'
  //  import { getSupabase } from '@/lib/supabase-server'

  //  export default async function Dashboard() {
  //    const supabase = await getSupabase()
  //    const { data: { user } } = await supabase.auth.getUser()
  //    if (!user) redirect('/')
  //    const { data: invites } = await supabase
  //      .from('invites').select('id, event_date, venue').order('created_at', { ascending: false })
  //    return (
  //      <main style={{ padding: 40 }}>
  //        <h1>Your invites</h1>
  //        <a href="/dashboard/new">+ New invite</a>
  //        <ul>
  //          {invites?.map(i => (
  //            <li key={i.id}><a href={`/dashboard/${i.id}`}>{i.event_date} at {i.venue}</a></li>
  //          ))}
  //        </ul>
  //      </main>
  //    )
  //  }