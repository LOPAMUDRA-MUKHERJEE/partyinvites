   import { redirect } from 'next/navigation'
   import { getSupabase } from '@/lib/supabase-server'
   import NewInviteForm from './NewInviteForm'

   export default async function NewInvitePage() {
     const supabase = await getSupabase()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) redirect('/')
     return <NewInviteForm userId={user.id} />
   }