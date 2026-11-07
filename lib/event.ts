// Shared helpers for event time, the reply lock and cancellation.
// Event times are entered and shown in IST (Asia/Kolkata).

export type InviteTiming = {
  status?: string | null
  event_at?: string | null
  rsvp_cutoff_days?: number | null
}

/** "19:00" -> "7:00 PM" */
export function formatTime12(time24: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time24)
  if (!m) return time24
  const h = Number(m[1])
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m[2]} ${suffix}`
}

/** Date "2026-11-20" + time "19:00", both read as IST -> a real moment in time */
export function eventInstant(date: string, time24: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time24)) return null
  const t = time24.length === 4 ? `0${time24}` : time24
  const d = new Date(`${date}T${t}:00+05:30`)
  return isNaN(d.getTime()) ? null : d
}

/** The moment replies stop being accepted: event start minus x days */
export function cutoffInstant(
  eventAt: string | null | undefined,
  days: number | null | undefined
): Date | null {
  if (!eventAt || days === null || days === undefined) return null
  const start = new Date(eventAt)
  if (isNaN(start.getTime())) return null
  return new Date(start.getTime() - days * 24 * 60 * 60 * 1000)
}

/** "Fri, 7 Nov, 7:00 PM IST" */
export function formatIST(d: Date): string {
  const s = d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${s.replace(/\bam\b/, 'AM').replace(/\bpm\b/, 'PM')} IST`
}

export type ReplyState =
  | { open: true }
  | { open: false; reason: 'cancelled' | 'closed' }

/** Are replies still accepted for this invite right now? */
export function replyState(inv: InviteTiming, now: Date = new Date()): ReplyState {
  if (inv.status === 'cancelled') return { open: false, reason: 'cancelled' }
  const cutoff = cutoffInstant(inv.event_at, inv.rsvp_cutoff_days)
  if (cutoff && now.getTime() >= cutoff.getTime()) return { open: false, reason: 'closed' }
  return { open: true }
}