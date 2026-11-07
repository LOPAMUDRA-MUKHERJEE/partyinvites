'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import InviteCard from '../../InviteCard'
import { writeInviteMessage } from './aiActions'
import { eventInstant, cutoffInstant, formatTime12, formatIST } from '@/lib/event'

export default function NewInviteForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [hostName, setHostName] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [rsvpDays, setRsvpDays] = useState('2')
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
    const days = Number(rsvpDays)
    if (rsvpDays.trim() === '' || !Number.isInteger(days) || days < 0 || days > 30) {
      setError('Replies close: enter a whole number of days between 0 and 30.')
      return
    }
    const at = eventInstant(date, time)
    if (!at) {
      setError('Please pick a valid date and time.')
      return
    }
    if (at.getTime() <= Date.now()) {
      setError('That date and time is already in the past.')
      return
    }
    const closes = cutoffInstant(at.toISOString(), days)
    if (closes && closes.getTime() <= Date.now()) {
      setError(`Replies would already be closed (${days} day(s) before the event). Choose fewer days.`)
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
        event_time: formatTime12(time), event_at: at.toISOString(), rsvp_cutoff_days: days,
        venue, message, design: 'diya',
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

  const startAt = date && time ? eventInstant(date, time) : null
  const daysNum = Number(rsvpDays)
  const closesAt =
    startAt && rsvpDays.trim() !== '' && Number.isInteger(daysNum) && daysNum >= 0 && daysNum <= 30
      ? cutoffInstant(startAt.toISOString(), daysNum)
      : null

  const box = {
    display: 'block',
    boxSizing: 'border-box' as const,
    width: '100%',
    minHeight: 44,
    margin: '0 0 14px',
    padding: 10,
    fontSize: 16,
    background: '#fbf3e2',
    color: '#2b1b0e',
    border: '1px solid #dcc59a',
    borderRadius: 8,
    colorScheme: 'light' as const,
  }

  const label = {
    display: 'block',
    margin: '0 0 4px',
    fontSize: 14,
    fontWeight: 600,
    color: '#5e4d3a',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1e3c8', color: '#2b1b0e' }}>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{ color: '#2b1b0e', marginTop: 0 }}>New Diwali invite</h1>

          <label htmlFor="host-name" style={label}>Your name</label>
          <input id="host-name" style={box} placeholder="Your name" value={hostName} onChange={e => setHostName(e.target.value)} />

          <label htmlFor="event-date" style={label}>Date</label>
          <input id="event-date" style={box} type="date" value={date} onChange={e => setDate(e.target.value)} />

          <label htmlFor="event-time" style={label}>Time</label>
          <input id="event-time" style={box} type="time" value={time} onChange={e => setTime(e.target.value)} />

          <label htmlFor="rsvp-days" style={label}>Replies close (days before the event)</label>
          <input
            id="rsvp-days"
            style={{ ...box, margin: '0 0 6px' }}
            type="number"
            min={0}
            max={30}
            step={1}
            value={rsvpDays}
            onChange={e => setRsvpDays(e.target.value)}
          />
          <p style={{ fontSize: 14, color: '#5e4d3a', margin: '0 0 14px' }}>
            {closesAt
              ? `Guests can reply or change their reply until ${formatIST(closesAt)}. After that, no replies are recorded.`
              : 'Guests can reply or change their reply until this many days before the event. After that, no replies are recorded.'}
          </p>

          <label htmlFor="event-venue" style={label}>Venue / address</label>
          <input id="event-venue" style={box} placeholder="Venue / address" value={venue} onChange={e => setVenue(e.target.value)} />

          <label htmlFor="tone" style={label}>Tone for the AI message</label>
          <select id="tone" style={box} value={tone} onChange={e => setTone(e.target.value)}>
            <option value="traditional">Traditional</option>
            <option value="funny">Funny</option>
            <option value="family">Family-style</option>
          </select>

          <button
            type="button"
            onClick={writeWithAI}
            disabled={writing}
            style={{
              margin: '0 0 14px',
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
          {aiNote && <p style={{ fontSize: 14, color: '#5e4d3a', margin: '0 0 14px' }}>{aiNote}</p>}

          <label htmlFor="message" style={label}>Message</label>
          <textarea
            id="message"
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
              marginTop: 4,
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
        <InviteCard hostName={hostName || 'You'} date={date} time={time ? formatTime12(time) : ''} venue={venue} message={message} />
      </div>
    </div>
  )
}




