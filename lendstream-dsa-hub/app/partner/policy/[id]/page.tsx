import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PolicyDetail } from '@/components/shared/PolicyDetail'
import type { Policy } from '@/lib/types'

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: policy }, { data: profile }] = await Promise.all([
    supabase.from('policies').select('*').eq('id', id).maybeSingle<Policy>(),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])
  if (!policy) notFound()

  return <PolicyDetail policy={policy} isOps={profile?.role === 'ops_admin'} />
}
