'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveReply } from './actions'

export default function ReplyForm({
  code,
  current,
}: {
  code: string
  current: string | null
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [chosen, setChosen] = useState(current)
  const [pending, startTransition] = useTransition()

  function choose(reply: string) {
    startTransition(async () => {
      const result = await saveReply(code, reply)
      setMessage(result.message)
      if (result.ok) setChosen(reply)
      // Replies closed (or event cancelled) while this page was open: reload to show that
      if (result.closed) router.refresh()
    })
  }

  function buttonStyle(value: string) {
    const selected = chosen === value
    return {
      flex: 1,
      padding: '14px 0',
      fontSize: 16,
      fontWeight: 600,
      borderRadius: 10,
      border: '2px solid #c9701a',
      background: selected ? '#c9701a' : '#ffffff',
      color: selected ? '#ffffff' : '#7a3b0a',
      cursor: pending ? 'wait' : 'pointer',
    } as const
  }

  return (
    <div>
      <p style={{ marginBottom: 8, fontWeight: 600 }}>Can you come?</p>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button style={buttonStyle('yes')} disabled={pending} onClick={() => choose('yes')}>Yes</button>
        <button style={buttonStyle('no')} disabled={pending} onClick={() => choose('no')}>No</button>
      </div>
      {chosen && <p>Your current reply: <b>{chosen === 'yes' ? 'Yes' : 'No'}</b></p>}
      {message && <p>{message}</p>}
    </div>
  )
}












//.....................................................................................



// 'use client'

// import { useState, useTransition } from 'react'
// import { saveReply } from './actions'

// export default function ReplyForm({
//   code,
//   current,
// }: {
//   code: string
//   current: string | null
// }) {
//   const [message, setMessage] = useState('')
//   const [chosen, setChosen] = useState(current)
//   const [pending, startTransition] = useTransition()

//   function choose(reply: string) {
//     startTransition(async () => {
//       const result = await saveReply(code, reply)
//       setMessage(result.message)
//       if (result.ok) setChosen(reply)
//     })
//   }

//   function buttonStyle(value: string) {
//     const selected = chosen === value
//     return {
//       flex: 1,
//       padding: '14px 0',
//       fontSize: 16,
//       fontWeight: 600,
//       borderRadius: 10,
//       border: '2px solid #c9701a',
//       background: selected ? '#c9701a' : '#ffffff',
//       color: selected ? '#ffffff' : '#7a3b0a',
//       cursor: pending ? 'wait' : 'pointer',
//     } as const
//   }

//   return (
//     <div>
//       <p style={{ marginBottom: 8, fontWeight: 600 }}>Can you come?</p>
//       <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
//         <button style={buttonStyle('yes')} disabled={pending} onClick={() => choose('yes')}>Yes</button>
//         <button style={buttonStyle('maybe')} disabled={pending} onClick={() => choose('maybe')}>Maybe</button>
//         <button style={buttonStyle('no')} disabled={pending} onClick={() => choose('no')}>No</button>
//       </div>
//       {chosen && <p>Your current reply: <b>{chosen}</b></p>}
//       {message && <p>{message}</p>}
//     </div>
//   )
// }







//.....................................................................................




// 'use client'

// import { useState, useTransition } from 'react'
// import { saveReply } from './actions'

// export default function ReplyForm({
//   code,
//   current,
// }: {
//   code: string
//   current: string | null
// }) {
//   const [message, setMessage] = useState('')
//   const [chosen, setChosen] = useState(current)
//   const [pending, startTransition] = useTransition()

//   function choose(reply: string) {
//     startTransition(async () => {
//       const result = await saveReply(code, reply)
//       setMessage(result.message)
//       if (result.ok) setChosen(reply)
//     })
//   }

//   return (
//     <div>
//       <p>Can you come?</p>
//       <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
//         <button disabled={pending} onClick={() => choose('yes')}>Yes</button>
//         <button disabled={pending} onClick={() => choose('maybe')}>Maybe</button>
//         <button disabled={pending} onClick={() => choose('no')}>No</button>
//       </div>
//       {chosen && <p>Your current reply: <b>{chosen}</b></p>}
//       {message && <p>{message}</p>}
//     </div>
//   )
// }