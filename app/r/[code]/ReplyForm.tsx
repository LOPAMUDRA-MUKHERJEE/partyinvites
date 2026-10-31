'use client'

import { useState, useTransition } from 'react'
import { saveReply } from './actions'

export default function ReplyForm({
  code,
  current,
}: {
  code: string
  current: string | null
}) {
  const [message, setMessage] = useState('')
  const [chosen, setChosen] = useState(current)
  const [pending, startTransition] = useTransition()

  function choose(reply: string) {
    startTransition(async () => {
      const result = await saveReply(code, reply)
      setMessage(result.message)
      if (result.ok) setChosen(reply)
    })
  }

  return (
    <div>
      <p>Can you come?</p>
      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button disabled={pending} onClick={() => choose('yes')}>Yes</button>
        <button disabled={pending} onClick={() => choose('maybe')}>Maybe</button>
        <button disabled={pending} onClick={() => choose('no')}>No</button>
      </div>
      {chosen && <p>Your current reply: <b>{chosen}</b></p>}
      {message && <p>{message}</p>}
    </div>
  )
}