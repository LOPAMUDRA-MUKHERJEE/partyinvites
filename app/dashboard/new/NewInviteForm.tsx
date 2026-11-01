   'use client'
   import { useState } from 'react'
   import { useRouter } from 'next/navigation'
   import { createBrowserClient } from '@supabase/ssr'
  //  import InviteCard, { DESIGNS, DesignKey } from '../../InviteCard'
  import InviteCard from '../../InviteCard'
   import { writeInviteMessage } from './aiActions'

   export default function NewInviteForm({ userId }: { userId: string }) {
     const router = useRouter()
     const [hostName, setHostName] = useState('')
     const [date, setDate] = useState('')
     const [time, setTime] = useState('')
     const [venue, setVenue] = useState('')
     const [message, setMessage] = useState('')
    //  const [design, setDesign] = useState<DesignKey>('diya')
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
          //  event_time: time, venue, message, design,
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
     const box = { display: 'block', margin: '8px 0', padding: 8, width: 320 }
     return (
       <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', padding: 40 }}>
         <div>
           <h1>New Diwali invite</h1>
           <input style={box} placeholder="Your name" value={hostName} onChange={e => setHostName(e.target.value)} />
           <input style={box} type="date" value={date} onChange={e => setDate(e.target.value)} />
           <input style={box} placeholder="Time, e.g. 7:00 PM" value={time} onChange={e => setTime(e.target.value)} />
           <input style={box} placeholder="Venue / address" value={venue} onChange={e => setVenue(e.target.value)} />
           <select style={box} value={tone} onChange={e => setTone(e.target.value)}>
  <option value="traditional">Traditional</option>
  <option value="funny">Funny</option>
  <option value="family">Family-style</option>
</select>
<button type="button" onClick={writeWithAI} disabled={writing} style={{ margin: '4px 0 8px' }}>
  {writing ? 'Writing...' : 'Write with AI'}
</button>
{aiNote && <p style={{ fontSize: 14 }}>{aiNote}</p>}
<textarea style={{ ...box, height: 90 }} placeholder="Your message, or press Write with AI" value={message} onChange={e => setMessage(e.target.value)} />
           {/* <select style={box} value={design} onChange={e => setDesign(e.target.value as DesignKey)}>
             {Object.entries(DESIGNS).map(([key, d]) => (
               <option key={key} value={key}>{d.label}</option>
             ))}
           </select> */}
           {error && <p style={{ color: 'red' }}>{error}</p>}
           <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save invite'}</button>
         </div>
         <InviteCard hostName={hostName || 'You'} date={date} time={time} venue={venue} message={message} />
       </div>
     )
   }