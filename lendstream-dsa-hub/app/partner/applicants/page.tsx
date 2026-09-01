import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Applicant, Lead } from '@/lib/types'
import { ApplicantsFilterBar } from '@/components/shared/ApplicantsFilterBar'
import { ApplicantsTable, type ApplicantExtras } from '@/components/shared/ApplicantsTable'

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let query = supabase.from('applicants').select('*').order('updated_at', { ascending: false })
  if (q) query = query.or(`client_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
  const { data: applicantRows } = await query.returns<Applicant[]>()
  const applicants = applicantRows ?? []
  const applicantIds = applicants.map((a) => a.id)

  const [{ data: leads }, { data: agentProfiles }] = await Promise.all([
    applicantIds.length
      ? supabase.from('leads').select('*').in('applicant_id', applicantIds).returns<Lead[]>()
      : Promise.resolve({ data: [] as Lead[] }),
    supabase.from('profiles').select('id, full_name'),
  ])
  const rows = leads ?? []
  const nameByAgent = new Map((agentProfiles ?? []).map((p) => [p.id, p.full_name]))

  const leadIds = rows.map((l) => l.id)
  const { data: assessments } = leadIds.length
    ? await supabase.from('assessments').select('lead_id, composite_score, verdict').in('lead_id', leadIds).order('computed_at', { ascending: false })
    : { data: [] as { lead_id: string; composite_score: number; verdict: string }[] }
  const latestByLead = new Map<string, { verdict: string; composite_score: number }>()
  for (const a of assessments ?? []) if (!latestByLead.has(a.lead_id)) latestByLead.set(a.lead_id, a)

  const appsByApplicant = new Map<string, Lead[]>()
  for (const l of rows) appsByApplicant.set(l.applicant_id, [...(appsByApplicant.get(l.applicant_id) ?? []), l])

  const extras = new Map<string, ApplicantExtras>(
    applicants.map((a) => [a.id, {
      apps: appsByApplicant.get(a.id) ?? [],
      latestByLead,
      isOwn: a.agent_id === user.id,
      ownerName: nameByAgent.get(a.agent_id) ?? null,
    }]),
  )

  return (
    <div className="pt-6">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-[#16161a]">Applicants</h1>
        <p className="text-[13px] text-[#7c7a75]">Every customer, with the loan applications they've asked for underneath</p>
      </div>

      <ApplicantsFilterBar
        basePath="/partner/applicants"
        q={q}
        summary={`${q ? `“${q}” · ` : ''}${applicants.length} applicant${applicants.length === 1 ? '' : 's'}`}
      />

      <ApplicantsTable rows={applicants} extras={extras} />
    </div>
  )
}
