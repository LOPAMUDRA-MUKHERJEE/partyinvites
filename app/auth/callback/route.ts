import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { encrypt } from '@/lib/crypto'
import { getAdminSupabase } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    console.log('Login failed:', error?.message)
    return NextResponse.redirect(`${origin}/?error=login_failed`)
  }

  const refreshToken = data.session.provider_refresh_token
  const userId = data.session.user.id

  if (refreshToken) {
    try {
      const admin = getAdminSupabase()
      const { error: saveError } = await admin.from('host_tokens').upsert({
        user_id: userId,
        encrypted_refresh_token: encrypt(refreshToken),
        needs_reauth: false,
        updated_at: new Date().toISOString(),
      })
      console.log('Saved refresh token?', !saveError, saveError?.message ?? '')
    } catch (e) {
      console.log('Saving token crashed:', e)
    }
  } else {
    console.log('No refresh token this time, keeping the old one if any')
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}



//..................................................................


// import { NextResponse } from 'next/server'
// import { cookies } from 'next/headers'
// import { createServerClient } from '@supabase/ssr'
// import { encrypt } from '@/lib/crypto'
// import { getAdminSupabase } from '@/lib/supabase-admin'

// export async function GET(request: Request) {
//   const { searchParams, origin } = new URL(request.url)
//   const code = searchParams.get('code')

//   if (!code) {
//     return NextResponse.redirect(`${origin}/?error=no_code`)
//   }

//   const cookieStore = await cookies()
//   const supabase = createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//     {
//       cookies: {
//         getAll: () => cookieStore.getAll(),
//         setAll: (list) =>
//           list.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           ),
//       },
//     }
//   )

//   const { data, error } = await supabase.auth.exchangeCodeForSession(code)

//   if (error || !data.session) {
//     console.log('Login failed:', error?.message)
//     return NextResponse.redirect(`${origin}/?error=login_failed`)
//   }

//   const refreshToken = data.session.provider_refresh_token
//   const userId = data.session.user.id

//   if (refreshToken) {
//     try {
//       const admin = getAdminSupabase()
//       const { error: saveError } = await admin.from('host_tokens').upsert({
//         user_id: userId,
//         encrypted_refresh_token: encrypt(refreshToken),
//         updated_at: new Date().toISOString(),
//       })
//       console.log('Saved refresh token?', !saveError, saveError?.message ?? '')
//     } catch (e) {
//       console.log('Saving token crashed:', e)
//     }
//   } else {
//     console.log('No refresh token this time, keeping the old one if any')
//   }

//   return NextResponse.redirect(`${origin}/dashboard`)
// }


//....................................................................


//    import { NextResponse } from 'next/server'
//    import { cookies } from 'next/headers'
//    import { createServerClient } from '@supabase/ssr'

//    export async function GET(request: Request) {
//      const { searchParams, origin } = new URL(request.url)
//      const code = searchParams.get('code')
//      if (code) {
//        const cookieStore = await cookies()
//        const supabase = createServerClient(
//          process.env.NEXT_PUBLIC_SUPABASE_URL!,
//          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//          {
//            cookies: {
//              getAll: () => cookieStore.getAll(),
//              setAll: (list) =>
//                list.forEach(({ name, value, options }) =>
//                  cookieStore.set(name, value, options)
//                ),
//            },
//          }
//        )
//        const { data } = await supabase.auth.exchangeCodeForSession(code)
//        console.log('Got refresh token?', !!data.session?.provider_refresh_token)
//      }
//      return NextResponse.redirect(`${origin}/dashboard`)
//    }