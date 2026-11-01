'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import InviteCard from '../../InviteCard'
import { writeInviteMessage } from './aiActions'

export default function NewInviteForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [venue, setVenue] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [tone, setTone] = useState('traditional')
  const [writing, setWriting] = useState(false)
  const [aiNote, setAiNote] = useState('')

  async function save() {
    if (!hostName || !date || !time || !venue) {
      setError('Please fill in name, date, time and venue.')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from('invites')
      .insert({
        host_id: userId, host_name: hostName, event_date: date,
        event_time: time, venue, message, design: 'diya',
      })
      .select('id')
      .single()
    setSaving(false)
    if (error) { setError(error.message); return }
    router.push(`/dashboard/${data.id}`)
  }

  async function writeWithAI() {
    if (!hostName.trim()) {
      setError('Please type your name first, so the message can use it.')
      return
    }
    if (message.trim() && !confirm('This will replace the message you typed. Continue?')) return
    setWriting(true)
    setError('')
    setAiNote('')
    try {
      const result = await writeInviteMessage(tone, hostName)
      setMessage(result.message)
      setAiNote(result.note ?? '')
    } catch {
      setError('Could not write a message. Please try again or type your own.')
    }
    setWriting(false)
  }

  const box = {
    display: 'block',
    boxSizing: 'border-box' as const,
    width: '100%',
    margin: '8px 0',
    padding: 10,
    fontSize: 16,
    background: '#fbf3e2',
    color: '#2b1b0e',
    border: '1px solid #dcc59a',
    borderRadius: 8,
    colorScheme: 'light' as const,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1e3c8', color: '#2b1b0e' }}>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ color: '#2b1b0e', marginTop: 0 }}>New Diwali invite</h1>
          <input style={box} placeholder="Your name" value={hostName} onChange={e => setHostName(e.target.value)} />
          <input style={box} placeholder="Enter Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <input style={box} placeholder="Time, e.g. 7:00 PM" value={time} onChange={e => setTime(e.target.value)} />
          <input style={box} placeholder="Venue / address" value={venue} onChange={e => setVenue(e.target.value)} />
          <select style={box} value={tone} onChange={e => setTone(e.target.value)}>
            <option value="traditional">Traditional</option>
            <option value="funny">Funny</option>
            <option value="family">Family-style</option>
          </select>
          <button
            type="button"
            onClick={writeWithAI}
            disabled={writing}
            style={{
              margin: '4px 0 8px',
              padding: '10px 16px',
              fontSize: 16,
              background: 'transparent',
              color: '#c2570c',
              border: '1px solid #c2570c',
              borderRadius: 8,
              cursor: writing ? 'default' : 'pointer',
              opacity: writing ? 0.6 : 1,
            }}
          >
            {writing ? 'Writing...' : 'Write with AI'}
          </button>
          {aiNote && <p style={{ fontSize: 14, color: '#5e4d3a' }}>{aiNote}</p>}
          <textarea
            style={{ ...box, height: 90 }}
            placeholder="Your message, or press Write with AI"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          {error && <p style={{ color: '#9b1c1c' }}>{error}</p>}
          <button
            onClick={save}
            disabled={saving}
            style={{
              marginTop: 8,
              padding: '12px 20px',
              fontSize: 16,
              background: '#c2570c',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save invite'}
          </button>
        </div>
        <InviteCard hostName={hostName || 'You'} date={date} time={time} venue={venue} message={message} />
      </div>
    </div>
  )
}