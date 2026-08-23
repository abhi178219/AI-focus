import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/shared/AppShell'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/partner')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, region')
    .eq('id', user.id)
    .single()

  // One portal for both roles. Access to individual records is enforced by RLS,
  // not by the route — an ops admin simply reads a wider set of rows here.
  if (!profile) redirect('/login')

  return (
    <AppShell
      userName={profile.full_name ?? 'Partner'}
      userSubtitle={profile.region ?? (profile.role === 'ops_admin' ? 'Operations' : 'Partner')}
    >
      {children}
    </AppShell>
  )
}
