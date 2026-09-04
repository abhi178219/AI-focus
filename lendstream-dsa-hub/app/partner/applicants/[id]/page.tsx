import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ArrowRight, Building2, ListChecks, Plus, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/shared/Avatar'
import { fmtAmount } from '@/lib/format'
import { ApplicantIdentityCard } from '@/components/shared/ApplicantIdentityCard'
import { KeyPersonnelList } from '@/components/shared/KeyPersonnelList'
import { AttributionCard } from '@/components/shared/AttributionCard'
import { ConsentCenterCard } from '@/components/shared/ConsentCenterCard'
import { ApplicantDocumentVault } from '@/components/shared/ApplicantDocumentVault'
import { RelationshipActivityCard } from '@/components/shared/RelationshipActivityCard'
import { RelationshipSnapshotCard, type RelationshipSnapshot } from '@/components/shared/RelationshipSnapshotCard'
import { RelationshipManagerCard } from '@/components/shared/RelationshipManagerCard'
import {
  LOAN_TYPE_LABEL, STAGE_LABELS, STAGE_PILL_STYLES, VERDICT_STYLES,
  type Applicant, type ApplicantConsent, type ApplicantDocument, type ApplicantInteraction,
  type ConsentType, type KeyPersonnel, type Lead,
} from '@/lib/types'

const CLOSED_STAGES = new Set(['DISBURSED', 'DROPPED'])

/**
 * Relationship tenure, from the earliest application on file to today.
 * "New relationship" is reserved for a genuinely new file — exactly one
 * application, created within the last 30 days — rather than being implied by
 * a small number.
 */
function relationshipTenure(earliestCreatedAt: string, applicationCount: number): string {
  const days = Math.floor((Date.now() - new Date(earliestCreatedAt).getTime()) / 86400000)
  if (applicationCount === 1 && days < 30) return 'New relationship'
  const months = Math.floor(days / 30.4375)
  if (months < 1) return 'Under 1 mo'
  if (months < 12) return `${months} mo`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest === 0 ? `${years} yr` : `${years} yr ${rest} mo`
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className={`text-[12.5px] font-semibold ${value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{value ?? '—'}</p>
    </div>
  )
}

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applicant } = await supabase.from('applicants').select('*').eq('id', id).single<Applicant>()
  if (!applicant) notFound()
  const isCompany = applicant.entity_type === 'COMPANY'
  const isOwn = applicant.agent_id === user.id

  // Ops can also set an RM's reporting line (e.g. correcting it on their
  // behalf) — same own-or-ops boundary updateReportingHierarchy enforces.
  const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const canEditRm = isOwn || viewerProfile?.role === 'ops_admin'

  const [
    { data: leads }, { data: rm }, { data: keyPersonnelRows }, { data: parentCompanyLink },
    { data: consentRows }, { data: vaultDocuments }, { data: relationshipInteractions },
  ] = await Promise.all([
    supabase.from('leads').select('*').eq('applicant_id', id).returns<Lead[]>(),
    supabase.from('profiles')
      .select('full_name, email, phone, region, team_manager_name, team_manager_phone, business_head_name, business_head_phone')
      .eq('id', applicant.agent_id).single(),
    // Only a company ever has key personnel underneath it.
    isCompany
      ? supabase.from('key_personnel').select('*').eq('company_applicant_id', id).returns<KeyPersonnel[]>()
      : Promise.resolve({ data: [] as KeyPersonnel[] }),
    // Reverse lookup: is THIS applicant a key person of some company?
    supabase.from('key_personnel').select('designation, company_applicant_id').eq('linked_applicant_id', id).maybeSingle(),
    // Consent history is append-only, so "current" is simply the newest row per
    // type — fetch the lot newest-first and take the first of each in JS rather
    // than reaching for a window function.
    supabase.from('applicant_consents').select('*').eq('applicant_id', id)
      .order('captured_at', { ascending: false }).returns<ApplicantConsent[]>(),
    supabase.from('applicant_documents').select('*').eq('applicant_id', id)
      .order('uploaded_at', { ascending: false }).returns<ApplicantDocument[]>(),
    supabase.from('applicant_interactions').select('*').eq('applicant_id', id)
      .order('occurred_at', { ascending: false }).returns<ApplicantInteraction[]>(),
  ])
  const apps = [...(leads ?? [])].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

  const latestConsentByType: Partial<Record<ConsentType, ApplicantConsent>> = {}
  for (const c of consentRows ?? []) if (!latestConsentByType[c.consent_type]) latestConsentByType[c.consent_type] = c

  // Relationship snapshot — every figure below comes from this applicant's own
  // `leads` rows, already fetched above. Nothing is estimated or modelled.
  const snapshot: RelationshipSnapshot = {
    // Real money out where we know it (disbursed), the ask where we don't.
    // Dropped applications are excluded — they represent no exposure at all.
    activeExposure: apps
      .filter((l) => l.stage !== 'DROPPED')
      .reduce((sum, l) => sum + Number(l.disbursed_amount ?? l.requested_amount ?? 0), 0),
    // The most recent application only. `existing_emis` is the applicant's
    // declaration of their OTHER obligations at that point in time — summing it
    // across applications would count the same external debt once per file.
    existingEmi: apps.length ? Number(apps[0].existing_emis ?? 0) : null,
    // `apps` is newest-first, so the earliest application is the last element.
    tenureLabel: apps.length ? relationshipTenure(apps[apps.length - 1].created_at, apps.length) : null,
    wonCount: apps.filter((l) => l.stage === 'DISBURSED').length,
    droppedCount: apps.filter((l) => l.stage === 'DROPPED').length,
    activeCount: apps.filter((l) => l.stage !== 'DISBURSED' && l.stage !== 'DROPPED').length,
  }

  const leadIds = apps.map((l) => l.id)
  const { data: assessments } = leadIds.length
    ? await supabase.from('assessments').select('lead_id, composite_score, verdict').in('lead_id', leadIds).order('computed_at', { ascending: false })
    : { data: [] as { lead_id: string; composite_score: number; verdict: string }[] }
  const latestByLead = new Map<string, { verdict: string; composite_score: number }>()
  for (const a of assessments ?? []) if (!latestByLead.has(a.lead_id)) latestByLead.set(a.lead_id, a)

  const active = apps.filter((l) => !CLOSED_STAGES.has(l.stage))
  const closed = apps.filter((l) => CLOSED_STAGES.has(l.stage))

  // PAN lives on the Applicant going forward, but older data (or a PAN
  // captured on one specific application via document extraction) may only
  // be on a lead — fall back to the first application that has one, rather
  // than showing "—" when the real value is sitting right there.
  const panNumber = applicant.pan_number ?? apps.find((l) => l.pan_number)?.pan_number ?? null

  // Key personnel are each their own full Applicant — one batched fetch for
  // their identity + one for their application counts, same pattern as the
  // Applicants list page.
  const keyPersonnel = keyPersonnelRows ?? []
  const linkedIds = keyPersonnel.map((k) => k.linked_applicant_id)
  const [{ data: linkedApplicants }, { data: linkedLeads }] = await Promise.all([
    linkedIds.length
      ? supabase.from('applicants').select('id, client_name, phone, email, pan_number').in('id', linkedIds)
      : Promise.resolve({ data: [] as { id: string; client_name: string; phone: string; email: string | null; pan_number: string | null }[] }),
    linkedIds.length
      ? supabase.from('leads').select('id, applicant_id').in('applicant_id', linkedIds)
      : Promise.resolve({ data: [] as { id: string; applicant_id: string }[] }),
  ])
  const linkedApplicantById = new Map((linkedApplicants ?? []).map((a) => [a.id, a]))
  const appCountByApplicant = new Map<string, number>()
  for (const l of linkedLeads ?? []) appCountByApplicant.set(l.applicant_id, (appCountByApplicant.get(l.applicant_id) ?? 0) + 1)

  let parentCompanyName: string | null = null
  if (parentCompanyLink?.company_applicant_id) {
    const { data: parent } = await supabase.from('applicants').select('client_name').eq('id', parentCompanyLink.company_applicant_id).single()
    parentCompanyName = parent?.client_name ?? null
  }

  return (
    <div className="pt-6">
      <Link href="/partner/applicants" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#7c7a75] hover:text-[#16161a]">
        <ArrowLeft size={14} /> All applicants
      </Link>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={applicant.client_name} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold leading-tight text-[#16161a]">{applicant.client_name}</h1>
              {isCompany && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eef1fe] px-2.5 py-1 text-[11px] font-semibold text-[#2440e8]">
                  <Building2 size={11} /> Company
                </span>
              )}
            </div>
            <p className="text-[13px] text-[#7c7a75]">
              {applicant.phone} · {apps.length} application{apps.length === 1 ? '' : 's'}
              {!isOwn && rm?.full_name && ` · ${rm.full_name}'s file`}
            </p>
            {parentCompanyName && (
              <Link href={`/partner/applicants/${parentCompanyLink!.company_applicant_id}`} className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#2440e8] hover:underline">
                {parentCompanyLink?.designation ? `${parentCompanyLink.designation} at` : 'Key personnel of'} {parentCompanyName} <ArrowRight size={11} />
              </Link>
            )}
          </div>
        </div>
        {isOwn && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/partner/applicants/${applicant.id}/task/new`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dcdbd6] bg-[#f7f6f4] px-4 py-2.5 text-[13px] font-semibold text-[#47453f] hover:bg-[#efeeeb]"
            >
              <ListChecks size={14} /> Add task
            </Link>
            <Link
              href={`/partner/applicants/${applicant.id}/application/new`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
            >
              <Plus size={14} strokeWidth={3} /> New application
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ApplicantIdentityCard applicant={applicant} isCompany={isCompany} isOwn={isOwn} panNumber={panNumber} />

        <RelationshipManagerCard
          profileId={applicant.agent_id}
          rm={rm}
          canEdit={canEditRm}
          applicantPath={`/partner/applicants/${applicant.id}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RelationshipSnapshotCard snapshot={snapshot} />
        </div>
        <AttributionCard applicant={applicant} isOwn={isOwn} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConsentCenterCard applicantId={applicant.id} latestByType={latestConsentByType} isOwn={isOwn} />
        <ApplicantDocumentVault applicantId={applicant.id} documents={vaultDocuments ?? []} isOwn={isOwn} />
      </div>

      <div className="mt-4">
        <RelationshipActivityCard
          applicantId={applicant.id}
          interactions={relationshipInteractions ?? []}
          isOwn={isOwn}
        />
      </div>

      {isCompany && (
        <div className="mt-4">
          <Card>
            <CardHead
              title="Key personnel"
              sub="Directors, partners and authorized signatories — each with their own applications"
              right={isOwn ? (
                <Link
                  href={`/partner/applicants/${applicant.id}/key-personnel/new`}
                  className="inline-flex items-center gap-1 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
                >
                  <UserPlus size={12} /> Add key personnel
                </Link>
              ) : undefined}
            />
            {keyPersonnel.length === 0 ? (
              <p className="px-6 py-8 text-center text-[13px] text-[#a8a6a0]">No key personnel added yet.</p>
            ) : (
              <KeyPersonnelList
                keyPersonnel={keyPersonnel}
                linkedApplicantById={linkedApplicantById}
                appCountByApplicant={appCountByApplicant}
                isOwn={isOwn}
              />
            )}
          </Card>
        </div>
      )}

      <div className="mt-4">
        <Card>
          <CardHead title="Active applications" sub="Currently in progress" />
          <ApplicationList apps={active} latestByLead={latestByLead} emptyText="No active applications." />
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHead title="Closed applications" sub="Disbursed or dropped" />
          <ApplicationList apps={closed} latestByLead={latestByLead} emptyText="No closed applications." />
        </Card>
      </div>
    </div>
  )
}

function ApplicationList({
  apps, latestByLead, emptyText,
}: {
  apps: Lead[]
  latestByLead: Map<string, { verdict: string; composite_score: number }>
  emptyText: string
}) {
  if (apps.length === 0) {
    return <p className="px-6 py-8 text-center text-[13px] text-[#a8a6a0]">{emptyText}</p>
  }
  return (
    <div className="divide-y divide-[#e7e6e2]">
      {apps.map((l) => {
        const a = latestByLead.get(l.id)
        const ageDays = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)
        return (
          <Link key={l.id} href={`/partner/leads/${l.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#efeeeb]">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[#16161a]">{LOAN_TYPE_LABEL[l.loan_type] ?? l.loan_type}</p>
              <p className="truncate text-[11px] text-[#7c7a75]">lead-{l.id.slice(0, 6)} · {ageDays}d ago</p>
            </div>
            {/* Stage-coloured pill, exactly as LeadHeader/LeadsTable render it —
                same class idiom, so a Sanctioned file reads the same everywhere. */}
            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STAGE_PILL_STYLES[l.stage]}`}>
              {STAGE_LABELS[l.stage]}
            </span>
            {a ? (
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${VERDICT_STYLES[a.verdict as keyof typeof VERDICT_STYLES]}`}>
                {a.verdict} {Math.round(a.composite_score)}
              </span>
            ) : (
              <span className="shrink-0 text-[10.5px] text-[#a8a6a0]">Not assessed</span>
            )}
            <span className="shrink-0 text-[13px] font-bold text-[#16161a] tnum">{fmtAmount(Number(l.requested_amount))}</span>
          </Link>
        )
      })}
    </div>
  )
}
