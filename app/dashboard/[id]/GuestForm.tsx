// 'use client'

// import { useState } from 'react'
// import { saveGuests } from './actions'

// const MAX_GUESTS = 20

// export default function GuestForm({
//   inviteId,
//   existingCount,
// }: {
//   inviteId: string
//   existingCount: number
// }) {
//   const room = MAX_GUESTS - existingCount
//   const [rows, setRows] = useState([{ name: '', email: '' }])
//   const [message, setMessage] = useState('')
//   const [busy, setBusy] = useState(false)

//   function update(i: number, field: 'name' | 'email', value: string) {
//     setRows(rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
//   }

//   async function onSave() {
//     setBusy(true)
//     const result = await saveGuests(inviteId, rows)
//     setMessage(result.message)
//     if (result.ok) setRows([{ name: '', email: '' }])
//     setBusy(false)
//   }

//   if (room <= 0) return <p>Guest list is full (20 of 20).</p>

//   return (
//     <div>
//       <p>You can add {room} more guest(s).</p>
//       {rows.map((r, i) => (
//         <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
//           <input placeholder="Name" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} />
//           <input placeholder="Email" value={r.email} onChange={(e) => update(i, 'email', e.target.value)} />
//         </div>
//       ))}
//       {/* {rows.length < room && (
//         <button type="button" onClick={() => setRows([...rows, { name: '', email: '' }])}>
//           + Add another row
//         </button>
//       )}{' '} */}
//             <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
//         {rows.length < room && (
//           <button type="button" onClick={() => setRows([...rows, { name: '', email: '' }])}>
//             + Add another row
//           </button>
//         )}
//         {/* <button type="button" onClick={onSave} disabled={busy}>
//           {busy ? 'Saving...' : 'Save guests'}
//         </button> */}
//       </div>
//       <button type="button" onClick={onSave} disabled={busy}>
//         {busy ? 'Saving...' : 'Save guests'}
//       </button>
//       {message && <p>{message}</p>}
//     </div>
//   )
// }



'use client'

import { useState } from 'react'
import { saveGuests } from './actions'

const MAX_GUESTS = 20

const inputStyle = {
  flex: 1,
  minWidth: 0,
  padding: '8px 10px',
  fontSize: 16,
  border: '1px solid #dcc59a',
  borderRadius: 8,
  background: '#fffaf0',
  color: '#2b1b0e',
} as const

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

  if (room <= 0) return <p style={{ color: '#5e4d3a' }}>Guest list is full (20 of 20).</p>

  return (
    <div>
      <p style={{ color: '#5e4d3a', margin: '0 0 10px' }}>You can add {room} more guest(s).</p>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="Name"
            value={r.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Email"
            value={r.email}
            onChange={(e) => update(i, 'email', e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {rows.length < room && (
          <button
            type="button"
            onClick={() => setRows([...rows, { name: '', email: '' }])}
            style={{
              background: 'transparent',
              color: '#2b1b0e',
              border: '1px solid #b89a66',
              padding: '9px 14px',
              borderRadius: 8,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            + Add another row
          </button>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          style={{
            background: '#c2570c',
            color: '#ffffff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 15,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Saving...' : 'Save guests'}
        </button>
      </div>
      {message && <p style={{ color: '#2b1b0e' }}>{message}</p>}
    </div>
  )
}