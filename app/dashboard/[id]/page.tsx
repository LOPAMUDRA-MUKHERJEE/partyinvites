import { redirect, notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import InviteCard from '../../InviteCard'
import GuestForm from './GuestForm'
import SendButton from './SendButton'

export default async function InvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: invite } = await supabase.from('invites').select('*').eq('id', id).single()
  if (!invite) notFound()

  // Only reached if the invite belongs to this host (checked just above)
  const admin = getAdminSupabase()
  const { data: guests } = await admin
    .from('guests')
    .select('id, name, email, status, reply')
    .eq('invite_id', id)
    .order('created_at', { ascending: true })
  const list = guests ?? []
  const pendingCount = list.filter((g) => g.status === 'not_sent' || g.status === 'failed').length

  const yesCount = list.filter((g) => g.reply === 'yes').length
  const maybeCount = list.filter((g) => g.reply === 'maybe').length
  const noCount = list.filter((g) => g.reply === 'no').length
  const waitingCount = list.filter((g) => !g.reply).length

  return (
    <main style={{ padding: 40 }}>
      <a href="/dashboard">← All invites</a>
      <h1>Your invite</h1>
      <InviteCard design={invite.design} hostName={invite.host_name} date={invite.event_date} time={invite.event_time} venue={invite.venue} message={invite.message} />

      <h2 style={{ marginTop: 32 }}>Guest list ({list.length} of 20)</h2>
      {list.length > 0 && (
        <p>
          <b>Replies:</b> Yes {yesCount}, Maybe {maybeCount}, No {noCount}, Waiting {waitingCount}
        </p>
      )}
      {list.length === 0 ? (
        <p>No guests yet.</p>
      ) : (
        <ul>
          {list.map((g) => (
            <li key={g.id}>
              {g.name} ({g.email}) – {g.status} – {g.reply ?? 'no reply yet'}
            </li>
          ))}
        </ul>
      )}
      <GuestForm inviteId={id} existingCount={list.length} />
      <SendButton inviteId={id} pendingCount={pendingCount} />
    </main>
  )
}