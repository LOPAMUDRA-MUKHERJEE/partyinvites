import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getAdminSupabase } from '../../../lib/supabase-admin'
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
    .select('host_name, event_date, event_time, venue')
    .eq('id', guest.invite_id)
    .maybeSingle()

  if (!invite) notFound()

  return (
    <main style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
      <Image
        src={diwaliCard}
        alt="Happy Diwali 2026 invitation"
        priority
        style={{ width: '100%', height: 'auto', borderRadius: 12 }}
      />
      <h1>Hi {guest.name}</h1>
      <p>{invite.host_name} invites you to Diwali.</p>
      <p>When: {invite.event_date} {invite.event_time}</p>
      <p>Where: {invite.venue}</p>
      <ReplyForm code={code} current={guest.reply} />
    </main>
  )
}


// import { notFound } from 'next/navigation'
// import { getAdminSupabase } from '../../../lib/supabase-admin'
// import ReplyForm from './ReplyForm'

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

//   return (
//     <main style={{ maxWidth: 480, margin: '40px auto', padding: 16 }}>
//       <h1>Hi {guest.name}</h1>
//       <p>{invite.host_name} invites you to Diwali.</p>
//       <p>When: {invite.event_date} {invite.event_time}</p>
//       <p>Where: {invite.venue}</p>
//       <ReplyForm code={code} current={guest.reply} />
//     </main>
//   )
// }