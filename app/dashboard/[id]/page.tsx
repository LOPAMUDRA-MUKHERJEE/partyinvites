import { redirect, notFound } from 'next/navigation'
import { getSupabase } from '@/lib/supabase-server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import InviteCard from '../../InviteCard'
import GuestForm from './GuestForm'
import SendButton from './SendButton'
import DeleteGuestButton from './DeleteGuestButton'

const C = {
  page: '#f1e3c8',
  text: '#2b1b0e',
  muted: '#5e4d3a',
  card: '#fbf3e2',
  border: '#dcc59a',
}

const STATUS_LABEL: Record<string, string> = {
  not_sent: 'Not sent',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
}

const REPLY_LABEL: Record<string, string> = {
  yes: 'Yes',
  maybe: 'Maybe',
  no: 'No',
}

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
    <main style={{ background: C.page, color: C.text, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <a href="/dashboard" style={{ color: C.muted, fontSize: 14 }}>← All invites</a>
        <h1 style={{ fontSize: 28, lineHeight: 1.25, margin: '12px 0 16px' }}>Your invite</h1>
        <InviteCard
          hostName={invite.host_name}
          date={invite.event_date}
          time={invite.event_time}
          venue={invite.venue}
          message={invite.message}
        />

        <h2 style={{ fontSize: 20, margin: '32px 0 6px' }}>Guest list ({list.length} of 20)</h2>
        {list.length > 0 && (
          <p style={{ color: C.muted, fontSize: 14, margin: '0 0 14px' }}>
            Replies: {yesCount} yes · {maybeCount} maybe · {noCount} no · {waitingCount} waiting
          </p>
        )}

        {list.length === 0 ? (
          <p style={{ color: C.muted }}>No guests yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {list.map((g) => (
              <div
                key={g.id}
                style={{
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{g.name}</div>
                  <div style={{ color: C.muted, fontSize: 14, overflowWrap: 'anywhere' }}>{g.email}</div>
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    <span style={{ fontWeight: 600, color: g.status === 'failed' ? '#9b1c1c' : C.text }}>
                      {STATUS_LABEL[g.status] ?? g.status}
                    </span>
                    <span style={{ color: C.muted }}>
                      {' · '}
                      {g.reply ? REPLY_LABEL[g.reply] ?? g.reply : 'No reply yet'}
                    </span>
                  </div>
                </div>
                {(g.status === 'not_sent' || g.status === 'failed') && (
                  <DeleteGuestButton inviteId={id} guestId={g.id} guestName={g.name} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 28 }}>
          <GuestForm inviteId={id} existingCount={list.length} />
        </div>
        <SendButton inviteId={id} pendingCount={pendingCount} />
      </div>
    </main>
  )
}