import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AddKeyPersonnelModal } from '@/components/shared/AddKeyPersonnelModal'

export default async function AddKeyPersonnelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase.from('applicants').select('id, agent_id, client_name').eq('id', id).single()
  if (!company) notFound()
  if (company.agent_id !== user.id) redirect(`/partner/applicants/${id}`)

  return <AddKeyPersonnelModal companyApplicantId={company.id} companyName={company.client_name} closeHref={`/partner/applicants/${id}`} />
}
