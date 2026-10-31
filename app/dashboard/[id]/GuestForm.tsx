'use client'

import { useState } from 'react'
import { saveGuests } from './actions'

const MAX_GUESTS = 20

export default function GuestForm({
  inviteId,
  existingCount,
}: {
  inviteId: string
  existingCount: number
}) {
  const room = MAX_GUESTS - existingCount
  const [rows, setRows] = useState([{ name: '', email: '' }])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function update(i: number, field: 'name' | 'email', value: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  async function onSave() {
    setBusy(true)
    const result = await saveGuests(inviteId, rows)
    setMessage(result.message)
    if (result.ok) setRows([{ name: '', email: '' }])
    setBusy(false)
  }

  if (room <= 0) return <p>Guest list is full (20 of 20).</p>

  return (
    <div>
      <p>You can add {room} more guest(s).</p>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input placeholder="Name" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} />
          <input placeholder="Email" value={r.email} onChange={(e) => update(i, 'email', e.target.value)} />
        </div>
      ))}
      {/* {rows.length < room && (
        <button type="button" onClick={() => setRows([...rows, { name: '', email: '' }])}>
          + Add another row
        </button>
      )}{' '} */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        {rows.length < room && (
          <button type="button" onClick={() => setRows([...rows, { name: '', email: '' }])}>
            + Add another row
          </button>
        )}
        <button type="button" onClick={onSave} disabled={busy}>
          {busy ? 'Saving...' : 'Save guests'}
        </button>
      </div>
      <button type="button" onClick={onSave} disabled={busy}>
        {busy ? 'Saving...' : 'Save guests'}
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}