   import { redirect } from 'next/navigation'
   import { getSupabase } from '@/lib/supabase-server'

   export default async function Dashboard() {
     const supabase = await getSupabase()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) redirect('/')
     const { data: invites } = await supabase
       .from('invites').select('id, event_date, venue').order('created_at', { ascending: false })
     return (
       <main style={{ padding: 40 }}>
         <h1>Your invites</h1>
         <a href="/dashboard/new">+ New invite</a>
         <ul>
           {invites?.map(i => (
             <li key={i.id}><a href={`/dashboard/${i.id}`}>{i.event_date} at {i.venue}</a></li>
           ))}
         </ul>
       </main>
     )
   }