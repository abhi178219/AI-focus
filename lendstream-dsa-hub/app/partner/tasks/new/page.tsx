import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewTaskModal } from '@/components/shared/NewTaskModal'

export default async function NewTaskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: applicants }, { data: leads }] = await Promise.all([
    supabase.from('applicants').select('id, client_name').eq('agent_id', user.id).order('client_name'),
    supabase.from('leads').select('id, client_name, loan_type, requested_amount').eq('agent_id', user.id).order('created_at', { ascending: false }),
  ])

  return <NewTaskModal applicants={applicants ?? []} leads={leads ?? []} closeHref="/partner/tasks" />
}
