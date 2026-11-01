'use client'

import { useState } from 'react'
import { deleteGuest } from './actions'

export default function DeleteGuestButton({
  inviteId,
  guestId,
  guestName,
}: {
  inviteId: string
  guestId: string
  guestName: string
}) {
  const [busy, setBusy] = useState(false)

  async function onDelete() {
    if (!confirm(`Remove ${guestName} from the guest list?`)) return
    setBusy(true)
    const result = await deleteGuest(inviteId, guestId)
    if (!result.ok) alert(result.message)
    setBusy(false)
  }

  return (
    <button type="button" onClick={onDelete} disabled={busy} style={{ marginLeft: 8 }}>
      {busy ? 'Removing...' : 'Remove'}
    </button>
  )
}