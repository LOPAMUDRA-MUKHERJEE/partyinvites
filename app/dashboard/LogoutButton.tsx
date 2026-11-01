'use client'
import { createBrowserClient } from '@supabase/ssr'

export default function LogoutButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const logout = async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) {
      alert('Log out did not work. Please try again.')
      return
    }
    window.location.href = '/'
  }

  return (
    <button
      onClick={logout}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        color: '#6b5a48',
        fontSize: 14,
        textDecoration: 'underline',
        cursor: 'pointer',
      }}
    >
      Log out
    </button>
  )
}