import Link from 'next/link'
import { Sparkles, ThumbsUp, TriangleAlert, LayoutGrid, Gauge, ArrowRight } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { BandPill, BandBar, Tag } from '@/components/ui/BandPill'
import { Avatar } from '@/components/shared/Avatar'
import { NarrativeCard } from '@/components/shared/NarrativeCard'
import { FileJourney } from '@/components/shared/FileJourney'
import { BAND_SOLID, type Lead, type Assessment, type AssessmentPillar, type DocumentRow } from '@/lib/types'
import { fmtAmount } from '@/lib/format'
import type { SectionView, Signal } from '@/lib/decision/sections'

const CONSTITUTION_LABEL: Record<string, string> = {
  PROPRIETORSHIP: 'Proprietorship', PARTNERSHIP: 'Partnership',
  PRIVATE_LIMITED: 'Private limited', LLP: 'LLP', PUBLIC_LIMITED: 'Public limited',
}
const GENDER_LABEL: Record<string, string> = { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other' }
const MARITAL_LABEL: Record<string, string> = { SINGLE: 'Single', MARRIED: 'Married', OTHER: 'Other' }
const EMPLOYMENT_LABEL: Record<string, string> = { SALARIED: 'Salaried', SELF_EMPLOYED: 'Self employed' }

function ageFrom(dob: string | null): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 && age < 120 ? age : null
}

export function LeadOverview({
  lead, leadId, basePath, assessment, pillars, sections, signals, documents,
}: {
  lead: Lead
  leadId: string
  basePath: string
  assessment: Assessment | null
  pillars: AssessmentPillar[]
  sections: SectionView[]
  signals: { strengths: Signal[]; concerns: Signal[] }
  documents: DocumentRow[]
}) {
  const age = ageFrom(lead.date_of_birth)
  const identityBits = [
    age !== null ? `${age} yrs` : null,
    lead.gender ? GENDER_LABEL[lead.gender] : null,
    lead.marital_status ? MARITAL_LABEL[lead.marital_status] : null,
    lead.employment_type ? EMPLOYMENT_LABEL[lead.employment_type] : null,
  ].filter(Boolean)

  const verified = documents.filter((d) => d.status === 'verified').length
  const docPct = documents.length ? (verified / documents.length) * 100 : 0

  const metaChips = [
    { label: 'Applicant', value: age !== null ? `${lead.client_name}, ${age}` : lead.client_name },
    { label: 'Entity', value: lead.business_constitution ? CONSTITUTION_LABEL[lead.business_constitution] : null },
    { label: 'Vintage', value: lead.business_vintage_years !== null ? `${lead.business_vintage_years} years` : null },
    { label: 'Industry', value: lead.industry },
    { label: 'Location', value: lead.property_city ?? lead.residence_city },
  ].filter((c) => c.value)

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        {/* Applicant */}
        <Card>
          <CardHead title="Applicant" sub="Who is asking, and for what" icon={<Avatar name={lead.client_name} size={20} />} />
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-[20px] bg-[#efeeeb] p-4">
              <div className="flex items-start gap-3 min-w-0">
                <Avatar name={lead.client_name} size={40} />
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#16161a]">{lead.client_name}</p>
                  <p className="text-[11.5px] text-[#5f5d58] mt-0.5">
                    {identityBits.length ? identityBits.join(' · ') : <span className="text-[#a8a6a0]">Profile details not filled in yet</span>}
                  </p>
                  <p className="text-[11.5px] text-[#5f5d58] mt-0.5">
                    {lead.phone}{lead.email ? ` · ${lead.email}` : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Amount required</p>
                <p className="text-[20px] font-bold text-[#16161a] tnum leading-tight">{fmtAmount(Number(lead.requested_amount))}</p>
                <p className="text-[11px] text-[#7c7a75]">{lead.loan_type}{lead.tenure_years ? ` · ${lead.tenure_years} years` : ''}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
              <Field label="Business" value={lead.business_name} />
              <Field label="Constitution" value={lead.business_constitution ? CONSTITUTION_LABEL[lead.business_constitution] : null} />
              <Field label="Vintage" value={lead.business_vintage_years !== null ? `${lead.business_vintage_years} years` : null} />
              <Field label="Monthly income" value={lead.monthly_income ? fmtAmount(Number(lead.monthly_income)) : null} />
              <Field label="Existing EMIs" value={lead.existing_emis ? `₹${Number(lead.existing_emis).toLocaleString('en-IN')}` : null} />
              <Field label="Bureau score" value={lead.cibil_score ? String(lead.cibil_score) : null} />
            </div>

            {metaChips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-[#5f5d58]">
                {metaChips.map((c) => (
                  <span key={c.label}><span className="text-[#7c7a75]">{c.label}</span> · {c.value}</span>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <NarrativeCard leadId={leadId} narrative={lead.case_narrative} generatedAt={lead.case_narrative_generated_at} />

        {/* Signals */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHead title="What supports this file" sub={`${signals.strengths.length} strongest signals`} icon={<ThumbsUp size={16} />} />
            <CardBody className="py-1">
              {signals.strengths.length === 0
                ? <p className="py-3 text-[12px] text-[#7c7a75]">Nothing scoring strongly yet.</p>
                : signals.strengths.map((s, i) => <SignalRow key={i} signal={s} />)}
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="What needs addressing"
              sub={`${signals.concerns.length} flagged`}
              icon={<TriangleAlert size={16} />}
              right={assessment?.knockouts?.length ? <Tag className="!bg-[#fbebeb] !text-[#b42318]">{assessment.knockouts.length} knockout</Tag> : undefined}
            />
            <CardBody className="py-1">
              {signals.concerns.length === 0
                ? <p className="py-3 text-[12px] text-[#7c7a75]">Nothing flagged — all signals moderate or better.</p>
                : signals.concerns.map((s, i) => <SignalRow key={i} signal={s} />)}
            </CardBody>
          </Card>
        </div>

        {/* Section snapshot */}
        <Card>
          <CardHead title="Section snapshot" sub="The load-bearing number from each part of the file" icon={<LayoutGrid size={16} />} />
          <CardBody>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sections.map((s) => (
                <Link
                  key={s.key}
                  href={`${basePath}/${leadId}?tab=${s.key.toLowerCase()}`}
                  className="rounded-[20px] bg-[#efeeeb] p-3.5 hover:bg-[#e3e2de] transition-colors"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#16161a]">{s.label}</p>
                    {s.band ? <BandPill band={s.band} size="xs" /> : <span className="text-[10px] text-[#a8a6a0]">Not scored</span>}
                  </div>
                  <p className="mb-2.5 truncate text-[11px] leading-snug text-[#7c7a75]">{s.headline}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {s.metrics.map((m) => (
                      <div key={m.label} className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[10.5px] text-[#7c7a75]">{m.label}</span>
                        <span className={`shrink-0 text-[11px] font-semibold tnum ${m.value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>
                          {m.value ?? '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Pillars */}
        <Card>
          <CardHead title="Assessment" sub="Four pillars, weighted into one verdict" icon={<Gauge size={16} />} />
          <CardBody className="space-y-3.5">
            {pillars.length === 0 ? (
              <p className="text-[12px] text-[#7c7a75]">
                No assessment run yet. Upload and parse documents, then run the assessment from the Decision tab.
              </p>
            ) : (
              <>
                {pillars.map((p) => (
                  <div key={p.id} className="flex items-center gap-3.5">
                    <span className="w-[104px] shrink-0">
                      <span className="block text-[12px] font-semibold text-[#47453f]">{p.pillar_code}</span>
                      <span className="block text-[10.5px] text-[#7c7a75] tnum">{Math.round(p.score)} / 100</span>
                    </span>
                    <BandBar value={p.score} band={p.band} className="h-2 flex-1" />
                    <span className="flex w-[86px] shrink-0 justify-end"><BandPill band={p.band} size="xs" /></span>
                  </div>
                ))}
                {assessment?.recommendation && (
                  <p className="border-t border-[#dcdbd6] pt-3 text-[13px] leading-relaxed text-[#47453f]">
                    {assessment.recommendation}
                  </p>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Right rail */}
      <div className="space-y-4">
        <FileJourney lead={lead} leadId={leadId} />

        <Card>
          <CardHead title="Next step" icon={<ArrowRight size={16} />} />
          <CardBody>
            <p className="text-[12px] leading-relaxed text-[#47453f]">{nextStep(lead, assessment, sections)}</p>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Documents" sub={`${verified} of ${documents.length} verified`} />
          <CardBody className="space-y-2">
            <BandBar value={docPct} band={docPct === 100 ? 'STRONG' : 'MODERATE'} className="h-2" />
            <p className="text-[11px] text-[#7c7a75]">
              {documents.length === 0
                ? 'No documents uploaded yet — the analysis sections stay empty until they are.'
                : docPct === 100 ? 'Checklist complete.' : 'Outstanding items are blocking submission readiness.'}
            </p>
            <Link href={`${basePath}/${leadId}?tab=documents`} className="inline-block text-[11px] font-semibold text-[#2440e8] hover:underline">
              Manage documents →
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function nextStep(lead: Lead, assessment: Assessment | null, sections: SectionView[]): string {
  const missing = sections.filter((s) => s.status === 'missing')
  if (!lead.monthly_income) return 'Capture monthly income on the Applicant tab — capacity cannot be computed without it.'
  if (missing.length) return `Collect the ${missing[0].sourceLabel.toLowerCase()} to score the ${missing[0].label} section${missing.length > 1 ? `, plus ${missing.length - 1} more outstanding` : ''}.`
  if (!assessment) return 'All inputs are on file — run the assessment to get a verdict.'
  if (assessment.governing_capacity && Number(lead.requested_amount) > assessment.governing_capacity) {
    return `Ask exceeds assessed capacity. Discuss resizing to ${fmtAmount(assessment.governing_capacity)}, or add a co-applicant to lift capacity.`
  }
  return assessment.recommendation ?? 'File is ready to progress to the next stage.'
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className={`truncate text-[12.5px] font-semibold ${value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{value ?? '—'}</p>
    </div>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-[#dcdbd6]/70 py-2.5 last:border-0">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${BAND_SOLID[signal.band]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] leading-snug text-[#16161a]">{signal.text}</p>
        {signal.detail && <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c7a75]">{signal.detail}</p>}
      </div>
      <Tag className="shrink-0">{signal.source}</Tag>
    </div>
  )
}
