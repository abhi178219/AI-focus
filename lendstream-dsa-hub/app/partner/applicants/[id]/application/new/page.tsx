import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewApplicationModal } from '@/components/shared/NewApplicationModal'

export default async function NewApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applicant } = await supabase.from('applicants').select('id, agent_id, client_name').eq('id', id).single()
  if (!applicant) notFound()

  // Only the Applicant's own agent can add an Application to it — the
  // dashboard already hides this link for anyone else (e.g. ops viewing a
  // partner's book), but guard the route directly too rather than letting
  // someone fill out the whole form only to hit an RLS error at the end.
  if (applicant.agent_id !== user.id) {
    redirect('/partner')
  }

  return <NewApplicationModal applicantId={applicant.id} applicantName={applicant.client_name} closeHref={`/partner/applicants/${applicant.id}`} />
}
