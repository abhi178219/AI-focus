import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewTaskModal } from '@/components/shared/NewTaskModal'

export default async function NewApplicantTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applicant } = await supabase.from('applicants').select('id, agent_id, client_name').eq('id', id).single()
  if (!applicant) notFound()
  if (applicant.agent_id !== user.id) redirect(`/partner/applicants/${id}`)

  return (
    <NewTaskModal
      applicants={[]}
      leads={[]}
      closeHref={`/partner/applicants/${id}`}
      prefillApplicant={{ id: applicant.id, client_name: applicant.client_name }}
    />
  )
}
