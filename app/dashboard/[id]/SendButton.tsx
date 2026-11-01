// 'use client'

// import { useState } from 'react'
// import { sendInvites } from './sendActions'

// export default function SendButton({ inviteId, pendingCount }: { inviteId: string; pendingCount: number }) {
//   const [busy, setBusy] = useState(false)
//   const [message, setMessage] = useState('')

//   async function onSend() {
//     if (!window.confirm(`Send ${pendingCount} email(s) from your Gmail?`)) return
//     setBusy(true)
//     setMessage('')
//     const result = await sendInvites(inviteId)
//     setMessage(result.message)
//     setBusy(false)
//   }

//   if (pendingCount === 0) return <p>No unsent guests.</p>

//   return (
//     <div style={{ marginTop: 24 }}>
//       <button type="button" onClick={onSend} disabled={busy}>
//         {busy ? 'Sending...' : `Send invites (${pendingCount})`}
//       </button>
//       {message && <p>{message}</p>}
//     </div>
//   )
// }



'use client'

import { useState } from 'react'
import { sendInvites } from './sendActions'

export default function SendButton({ inviteId, pendingCount }: { inviteId: string; pendingCount: number }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function onSend() {
    if (!window.confirm(`Send ${pendingCount} email(s) from your Gmail?`)) return
    setBusy(true)
    setMessage('')
    const result = await sendInvites(inviteId)
    setMessage(result.message)
    setBusy(false)
  }

  if (pendingCount === 0) return <p style={{ color: '#5e4d3a', marginTop: 24 }}>No unsent guests.</p>

  return (
    <div style={{ marginTop: 24 }}>
      <button
        type="button"
        onClick={onSend}
        disabled={busy}
        style={{
          background: '#c2570c',
          color: '#ffffff',
          border: 'none',
          padding: '12px 22px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 16,
          cursor: busy ? 'default' : 'pointer',
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy ? 'Sending...' : `Send invites (${pendingCount})`}
      </button>
      {message && <p style={{ color: '#2b1b0e' }}>{message}</p>}
    </div>
  )
}