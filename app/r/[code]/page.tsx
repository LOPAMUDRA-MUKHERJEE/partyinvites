import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAdminSupabase } from '../../../lib/supabase-admin'
import { cutoffInstant, formatIST, replyState } from '../../../lib/event'
import ReplyForm from './ReplyForm'
import diwaliCard from '../../../public/diwali-card.png'

export default async function ReplyPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const admin = getAdminSupabase()

  const { data: guest } = await admin
    .from('guests')
    .select('name, reply, invite_id')
    .eq('reply_code', code)
    .maybeSingle()

  if (!guest) notFound()

  const { data: invite } = await admin
    .from('invites')
    .select('host_name, event_date, event_time, venue, status, event_at, rsvp_cutoff_days, cancel_reason')
    .eq('id', guest.invite_id)
    .maybeSingle()

  if (!invite) notFound()

  const state = replyState(invite)
  const cutoff = cutoffInstant(invite.event_at, invite.rsvp_cutoff_days)
  const replyLabel = guest.reply === 'yes' ? 'Yes' : guest.reply === 'no' ? 'No' : null

  const notice = {
    background: '#ffffff',
    border: '1px solid #f0d9b0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    lineHeight: 1.6,
  } as const

  return (
    <div style={{ minHeight: '100vh', background: '#fff4e0', color: '#3b1a08', padding: '24px 16px' }}>
      <main style={{ maxWidth: 480, margin: '0 auto' }}>
        <Image
          src={diwaliCard}
          alt="Happy Diwali 2026 invitation"
          priority
          style={{ width: '100%', height: 'auto', borderRadius: 12 }}
        />
        <h1 style={{ fontSize: 26, margin: '20px 0 4px' }}>Hi {guest.name}</h1>

        {!state.open && state.reason === 'cancelled' ? (
          <div style={{ ...notice, borderColor: '#9b1c1c' }}>
            <b>This event has been cancelled.</b>
            {invite.cancel_reason && <div>Reason: {invite.cancel_reason}</div>}
            <div style={{ marginTop: 6 }}>
              {invite.host_name} had planned it for {invite.event_date} {invite.event_time}.
            </div>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 16px' }}>{invite.host_name} invites you to Diwali.</p>
            <div style={{ ...notice, lineHeight: 1.7 }}>
              <div><b>When:</b> {invite.event_date} {invite.event_time}</div>
              <div><b>Where:</b> {invite.venue}</div>
            </div>

            {state.open ? (
              <>
                <ReplyForm code={code} current={guest.reply} />
                {cutoff && (
                  <p style={{ marginTop: 16, fontSize: 14 }}>
                    You can reply or change your reply until {formatIST(cutoff)}.
                  </p>
                )}
              </>
            ) : (
              <div style={notice}>
                <b>Replies are closed.</b>
                {cutoff && <div>They closed on {formatIST(cutoff)}.</div>}
                <div style={{ marginTop: 6 }}>
                  {replyLabel ? <>Your reply on record: <b>{replyLabel}</b></> : 'No reply was recorded for you.'}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}















// import Image from 'next/image'
// import { notFound } from 'next/navigation'
// import { getAdminSupabase } from '../../../lib/supabase-admin'
// import ReplyForm from './ReplyForm'
// import diwaliCard from '../../../public/diwali-card.png'

// export default async function ReplyPage({
//   params,
// }: {
//   params: Promise<{ code: string }>
// }) {
//   const { code } = await params
//   const admin = getAdminSupabase()

//   const { data: guest } = await admin
//     .from('guests')
//     .select('name, reply, invite_id')
//     .eq('reply_code', code)
//     .maybeSingle()

//   if (!guest) notFound()

//   const { data: invite } = await admin
//     .from('invites')
//     .select('host_name, event_date, event_time, venue')
//     .eq('id', guest.invite_id)
//     .maybeSingle()

//   if (!invite) notFound()


//       return (
//     <div style={{ minHeight: '100vh', background: '#fff4e0', color: '#3b1a08', padding: '24px 16px' }}>
//       <main style={{ maxWidth: 480, margin: '0 auto' }}>
//         <Image
//           src={diwaliCard}
//           alt="Happy Diwali 2026 invitation"
//           priority
//           style={{ width: '100%', height: 'auto', borderRadius: 12 }}
//         />
//         <h1 style={{ fontSize: 26, margin: '20px 0 4px' }}>Hi {guest.name}</h1>
//         <p style={{ margin: '0 0 16px' }}>{invite.host_name} invites you to Diwali.</p>
//         <div style={{ background: '#ffffff', border: '1px solid #f0d9b0', borderRadius: 12, padding: 16, marginBottom: 20, lineHeight: 1.7 }}>
//           <div><b>When:</b> {invite.event_date} {invite.event_time}</div>
//           <div><b>Where:</b> {invite.venue}</div>
//         </div>
//         <ReplyForm code={code} current={guest.reply} />
//       </main>
//     </div>
//   )

// }


