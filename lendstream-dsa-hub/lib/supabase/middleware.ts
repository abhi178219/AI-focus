import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// One portal. Both roles land in the same place; what differs between them is
// RLS read scope (a partner sees only their own leads), not the UI surface.
const PORTAL_ROOTS: Record<string, string> = {
  dsa_partner: '/partner',
  ops_admin: '/partner',
}

const PORTAL_PREFIXES = ['/partner'] as const

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPortalPath = PORTAL_PREFIXES.some((p) => path.startsWith(p))

  if (!user) {
    if (isPortalPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Authenticated — resolve role to enforce portal boundaries and post-login routing.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined
  const myRoot = role ? PORTAL_ROOTS[role] : undefined

  if ((path === '/login' || path === '/') && myRoot) {
    const url = request.nextUrl.clone()
    url.pathname = myRoot
    return NextResponse.redirect(url)
  }

  if (isPortalPath && myRoot && !path.startsWith(myRoot)) {
    const url = request.nextUrl.clone()
    url.pathname = myRoot
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
