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

  if (pendingCount === 0) return <p>No unsent guests.</p>

  return (
    <div style={{ marginTop: 24 }}>
      <button type="button" onClick={onSend} disabled={busy}>
        {busy ? 'Sending...' : `Send invites (${pendingCount})`}
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}