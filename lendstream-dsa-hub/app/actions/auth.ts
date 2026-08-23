'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Single portal — both roles land here. See lib/supabase/middleware.ts.
const PORTAL_ROOTS: Record<string, string> = {
  dsa_partner: '/partner',
  ops_admin: '/partner',
}

function safeDestination(redirectParam: string, role: string | undefined) {
  const portalRoots = Object.values(PORTAL_ROOTS)
  // Only ever redirect within our own portal roots — an unvalidated redirect
  // param on a login page is a phishing primitive.
  const isSafeRedirect = portalRoots.some((root) => redirectParam === root || redirectParam.startsWith(`${root}/`))
  return isSafeRedirect ? redirectParam : (role ? PORTAL_ROOTS[role] : '/')
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const redirectParam = String(formData.get('redirect') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: error?.message ?? 'Invalid email or password' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role as string | undefined
  redirect(safeDestination(redirectParam, role) || '/')
}

// Real self-signup for DSA partners — every new account lands as
// role='dsa_partner' via the handle_new_user() trigger regardless of what a
// client sends here; there is no client-writable role field.
export async function signup(formData: FormData) {
  const fullName = String(formData.get('full_name') ?? '')
  const email = String(formData.get('email') ?? '')
  const phone = String(formData.get('phone') ?? '')
  const password = String(formData.get('password') ?? '')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, phone } },
  })

  if (error || !data.user) {
    return { error: error?.message ?? 'Could not create account' }
  }

  redirect('/partner')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
