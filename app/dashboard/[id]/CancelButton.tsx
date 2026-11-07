'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelEvent } from './cancelActions'

const RED = '#9b1c1c'

export default function CancelButton({
  inviteId,
  cancelled,
  willEmail,
}: {
  inviteId: string
  cancelled: boolean
  willEmail: number // guests who would get a cancellation email right now
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function run() {
    const text = cancelled
      ? `Send the cancellation email to ${willEmail} guest(s)?`
      : `Cancel this event and email ${willEmail} guest(s)? This cannot be undone.`
    if (!window.confirm(text)) return
    setBusy(true)
    setMessage('')
    const result = await cancelEvent(inviteId, reason)
    setMessage(result.message)
    setBusy(false)
    setOpen(false)
    router.refresh()
  }

  const solid = {
    background: RED,
    color: '#ffffff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 15,
    cursor: busy ? 'default' : 'pointer',
    opacity: busy ? 0.7 : 1,
  } as const

  // Already cancelled: only show a button if some guests still have not been told
  if (cancelled) {
    return (
      <div style={{ marginTop: 24 }}>
        {willEmail > 0 && (
          <button type="button" onClick={run} disabled={busy} style={solid}>
            {busy ? 'Sending...' : `Send cancellation emails (${willEmail})`}
          </button>
        )}
        {message && <p style={{ color: '#2b1b0e' }}>{message}</p>}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 36, paddingTop: 20, borderTop: '1px solid #dcc59a' }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{ ...solid, background: 'transparent', color: RED, border: `1px solid ${RED}` }}
        >
          Cancel this event
        </button>
      ) : (
        <div>
          <label htmlFor="cancel-reason" style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5e4d3a', marginBottom: 4 }}>
            Reason (optional, one line, shown to guests)
          </label>
          <input
            id="cancel-reason"
            value={reason}
            maxLength={140}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Heavy rain is forecast, we will reschedule"
            style={{
              display: 'block',
              boxSizing: 'border-box',
              width: '100%',
              padding: 10,
              fontSize: 16,
              background: '#fbf3e2',
              color: '#2b1b0e',
              border: '1px solid #dcc59a',
              borderRadius: 8,
              margin: '0 0 12px',
              colorScheme: 'light',
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={run} disabled={busy} style={solid}>
              {busy ? 'Cancelling...' : `Cancel event and email ${willEmail} guest(s)`}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              style={{ ...solid, background: 'transparent', color: '#5e4d3a', border: '1px solid #dcc59a' }}
            >
              Keep event
            </button>
          </div>
        </div>
      )}
      {message && <p style={{ color: '#2b1b0e' }}>{message}</p>}
    </div>
  )
}