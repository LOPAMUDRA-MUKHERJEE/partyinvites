const COLORS = { bg: '#2b1055', fg: '#ffd27a', accent: '#ff9f1c' }

export default function InviteCard(props: {
  hostName: string
  date: string
  time: string
  venue: string
  message: string
}) {
  return (
    <div style={{
      background: COLORS.bg, color: COLORS.fg, padding: 32, borderRadius: 16,
      border: `3px solid ${COLORS.accent}`, maxWidth: 420, textAlign: 'center',
    }}>
      <div style={{ fontSize: 40 }}>🪔</div>
      <h2 style={{ color: COLORS.accent, margin: '8px 0' }}>Diwali Celebration</h2>
      <p>Hi (guest name), you're invited!</p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{props.message || 'Your message will appear here.'}</p>
      <p><b>{props.date}</b> at <b>{props.time}</b></p>
      <p>{props.venue}</p>
      <p style={{ opacity: 0.8 }}>Hosted by {props.hostName}</p>
    </div>
  )
}







// export const DESIGNS = {
//   diya: { label: 'Diya Glow', bg: '#2b1055', fg: '#ffd27a', accent: '#ff9f1c' },
//   rangoli: { label: 'Rangoli Bright', bg: '#fff4e0', fg: '#7a1f3d', accent: '#e63946' },
//   royal: { label: 'Royal Gold', bg: '#1a1a1a', fg: '#f5d98b', accent: '#c9a227' },
// } as const

// export type DesignKey = keyof typeof DESIGNS

// export default function InviteCard(props: {
//   design: DesignKey
//   hostName: string
//   date: string
//   time: string
//   venue: string
//   message: string
// }) {
//   const d = DESIGNS[props.design] ?? DESIGNS.diya
//   return (
//     <div style={{
//       background: d.bg, color: d.fg, padding: 32, borderRadius: 16,
//       border: `3px solid ${d.accent}`, maxWidth: 420, textAlign: 'center',
//     }}>
//       <div style={{ fontSize: 40 }}>🪔</div>
//       <h2 style={{ color: d.accent, margin: '8px 0' }}>Diwali Celebration</h2>
//       <p>Hi (guest name), you're invited!</p>
//       <p style={{ whiteSpace: 'pre-wrap' }}>{props.message || 'Your message will appear here.'}</p>
//       <p><b>{props.date}</b> at <b>{props.time}</b></p>
//       <p>{props.venue}</p>
//       <p style={{ opacity: 0.8 }}>Hosted by {props.hostName}</p>
//     </div>
//   )
// }

