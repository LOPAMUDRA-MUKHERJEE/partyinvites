   'use client'
   import { useState } from 'react'
   import { useRouter } from 'next/navigation'
   import { createBrowserClient } from '@supabase/ssr'
   import InviteCard, { DESIGNS, DesignKey } from '../../InviteCard'

   export default function NewInviteForm({ userId }: { userId: string }) {
     const router = useRouter()
     const [hostName, setHostName] = useState('')
     const [date, setDate] = useState('')
     const [time, setTime] = useState('')
     const [venue, setVenue] = useState('')
     const [message, setMessage] = useState('')
     const [design, setDesign] = useState<DesignKey>('diya')
     const [error, setError] = useState('')
     const [saving, setSaving] = useState(false)

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
           event_time: time, venue, message, design,
         })
         .select('id')
         .single()
       setSaving(false)
       if (error) { setError(error.message); return }
       router.push(`/dashboard/${data.id}`)
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
           <textarea style={{ ...box, height: 90 }} placeholder="Your message (AI writing comes on Day 5)" value={message} onChange={e => setMessage(e.target.value)} />
           <select style={box} value={design} onChange={e => setDesign(e.target.value as DesignKey)}>
             {Object.entries(DESIGNS).map(([key, d]) => (
               <option key={key} value={key}>{d.label}</option>
             ))}
           </select>
           {error && <p style={{ color: 'red' }}>{error}</p>}
           <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save invite'}</button>
         </div>
         <InviteCard design={design} hostName={hostName || 'You'} date={date} time={time} venue={venue} message={message} />
       </div>
     )
   }