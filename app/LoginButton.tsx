   'use client'
   import { createBrowserClient } from '@supabase/ssr'

   export default function LoginButton() {
     const supabase = createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
     const login = () =>
       supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: `${location.origin}/auth/callback`,
           scopes: 'https://www.googleapis.com/auth/gmail.send',
           queryParams: { access_type: 'offline', prompt: 'consent' },
         },
       })
     return <button onClick={login}>Log in with Google</button>
   }