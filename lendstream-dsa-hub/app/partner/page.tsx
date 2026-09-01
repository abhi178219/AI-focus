import Link from 'next/link'
import { AlertCircle, MoreHorizontal, Plus, Check, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/shared/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { PillarRadar, type RadarAxis } from '@/components/shared/PillarRadar'
import { PassRateByRm, type RmPassRate } from '@/components/shared/PassRateByRm'
import { StatLine } from '@/components/shared/StatTile'
import {
  LOAN_TYPE_LABEL, STAGE_LABELS, VERDICT_STYLES, BAND_STYLES, BAND_LABEL, FUNNEL_STAGES,
  type Lead, type Applicant, type Band, type Verdict,
} from '@/lib/types'
import { fmtAmount } from '@/lib/format'

/** Radar axis labels, in the prototype's order. */
const PILLAR_LABEL: Record<string, string> = {
  BANKING: 'Banking', GST: 'GST', BUREAU: 'Bureau', COLLATERAL: 'Collateral',
}

function bandOf(score: number): Band {
  if (score >= 85) return 'STRONG'
  if (score >= 70) return 'GOOD'
  if (score >= 55) return 'MODERATE'
  if (score >= 40) return 'WEAK'
  return 'CRITICAL'
}

export default async function PartnerDashboard() {
  const supabase = await createClient()
  const [{ data: { user } }, { data: leads }, { data: applicantRows }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('leads').select('*').returns<Lead[]>(),
    supabase.from('applicants').select('*').order('updated_at', { ascending: false }).returns<Applicant[]>(),
  ])
  const rows = leads ?? []
  const applicants = applicantRows ?? []

  // Applications (leads) grouped under their Applicant — HubSpot's
  // Contact→Deals relation. "New lead" always creates one of each together;
  // a second Application is only ever added explicitly from the Applicant's
  // own row here, never inferred from a matching phone number. See
  // /decisions/2026-08-31-lendstream-dsa-hub-applicant-application-relation.md.
  const applicationsByApplicant = new Map<string, Lead[]>()
  for (const l of rows) {
    const list = applicationsByApplicant.get(l.applicant_id) ?? []
    list.push(l)
    applicationsByApplicant.set(l.applicant_id, list)
  }

  const disbursedValue = rows.reduce((sum, l) => sum + Number(l.disbursed_amount ?? 0), 0)
  const activePipeline = rows.filter((l) => !['DISBURSED', 'DROPPED'].includes(l.stage))
  const activePipelineValue = activePipeline.reduce((sum, l) => sum + Number(l.requested_amount), 0)
  const avgTicket = rows.length ? rows.reduce((sum, l) => sum + Number(l.requested_amount), 0) / rows.length : 0
  const disbursedCount = rows.filter((l) => l.stage === 'DISBURSED').length
  const reachRate = rows.length ? (disbursedCount / rows.length) * 100 : null

  const leadIds = rows.map((l) => l.id)
  const [{ data: assessments }, { data: pillarRows }] = leadIds.length
    ? await Promise.all([
        supabase.from('assessments').select('lead_id, composite_score, verdict, knockouts, computed_at').in('lead_id', leadIds).order('computed_at', { ascending: false }),
        supabase.from('assessments').select('id, lead_id, computed_at, assessment_pillars(pillar_code, score, band, headline)').in('lead_id', leadIds).order('computed_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }]

  const latestByLead = new Map<string, { composite_score: number; verdict: Verdict; knockouts: string[] }>()
  for (const a of assessments ?? []) if (!latestByLead.has(a.lead_id)) latestByLead.set(a.lead_id, a as never)

  // First weak/critical pillar (or knockout) explains WHY a file needs attention.
  // The same pass also feeds the radar, which averages the LATEST assessment's
  // pillar scores per lead — never a synthesised figure.
  const reasonByLead = new Map<string, string>()
  const seenPillarLead = new Set<string>()
  const pillarTotals = new Map<string, { sum: number; n: number }>()
  for (const a of (pillarRows ?? []) as { lead_id: string; assessment_pillars: { pillar_code: string; score: number; band: Band; headline: string | null }[] }[]) {
    if (seenPillarLead.has(a.lead_id)) continue
    seenPillarLead.add(a.lead_id)
    const pillars = a.assessment_pillars ?? []
    const worst = pillars.find((p) => p.band === 'CRITICAL') ?? pillars.find((p) => p.band === 'WEAK')
    if (worst) reasonByLead.set(a.lead_id, worst.headline ?? `${worst.pillar_code} ${BAND_LABEL[worst.band].toLowerCase()}`)
    for (const p of pillars) {
      // A pillar the engine could not assess is stored with score 0 and no
      // headline; averaging those in would drag the shape down dishonestly.
      if (p.headline === 'Not applicable' || p.headline == null) continue
      const e = pillarTotals.get(p.pillar_code) ?? { sum: 0, n: 0 }
      e.sum += Number(p.score)
      e.n += 1
      pillarTotals.set(p.pillar_code, e)
    }
  }

  const radarAxes: RadarAxis[] = [...pillarTotals.entries()]
    .map(([code, { sum, n }]) => ({ label: PILLAR_LABEL[code] ?? code, value: n ? sum / n : 0 }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const assessed = [...latestByLead.values()]
  const avgCompositeScore = assessed.length ? assessed.reduce((s, a) => s + a.composite_score, 0) / assessed.length : null
  const passRate = assessed.length ? (assessed.filter((a) => a.verdict === 'PASS').length / assessed.length) * 100 : null

  // Pass rate by RM. RLS scopes a partner to their own leads, so in practice
  // this resolves to a single row — the signed-in partner. The card says so.
  const byAgent = new Map<string, { pass: number; total: number }>()
  for (const l of rows) {
    const a = latestByLead.get(l.id)
    if (!a) continue
    const e = byAgent.get(l.agent_id) ?? { pass: 0, total: 0 }
    e.total += 1
    if (a.verdict === 'PASS') e.pass += 1
    byAgent.set(l.agent_id, e)
  }
  // Union with every Applicant's owner too — an ops_admin sees every
  // partner's Applicants on the card below, and needs to see whose book each
  // one belongs to (two partners can otherwise render as identical rows).
  const agentIds = [...new Set([...byAgent.keys(), ...applicants.map((a) => a.agent_id)])]
  const { data: agentProfiles } = agentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', agentIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameByAgent = new Map((agentProfiles ?? []).map((p) => [p.id, p.full_name]))
  const rmRows: RmPassRate[] = [...byAgent.entries()]
    .map(([id, { pass, total }]) => ({
      id,
      name: nameByAgent.get(id) ?? (id === user?.id ? 'You' : `${id.slice(0, 8)}…`),
      rate: total ? (pass / total) * 100 : 0,
      assessed: total,
    }))
    .sort((a, b) => b.rate - a.rate)

  // Six condensed milestone stages, as the prototype — Contacted and
  // Documentation are working states rather than funnel milestones.
  const funnel = FUNNEL_STAGES.map((stage) => ({
    stage, count: rows.filter((l) => l.stage === stage).length,
  }))

  const byLoanType = new Map<string, { count: number; total: number }>()
  for (const l of rows) {
    const e = byLoanType.get(l.loan_type) ?? { count: 0, total: 0 }
    e.count += 1
    e.total += Number(l.requested_amount)
    byLoanType.set(l.loan_type, e)
  }
  const productTiles = [...byLoanType.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 3)

  const needsAttention = rows
    .map((l) => ({ lead: l, a: latestByLead.get(l.id) }))
    .filter((x): x is { lead: Lead; a: { composite_score: number; verdict: Verdict; knockouts: string[] } } =>
      x.a?.verdict === 'REFER' || x.a?.verdict === 'DECLINE')
    .slice(0, 5)

  const recentLeads = [...rows].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5)

  // 12 months, matching the prototype's "Last 12 months, ₹ lakh".
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (11 - i))
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), total: 0 }
  })
  for (const l of rows) {
    if (l.stage !== 'DISBURSED' || !l.disbursed_amount) continue
    const d = new Date(l.updated_at)
    const bucket = monthly.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (bucket) bucket.total += Number(l.disbursed_amount)
  }
  const monthlyMax = Math.max(...monthly.map((m) => m.total), 1)

  return (
    <div className="pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#16161a]">Dashboard</h1>
          <p className="text-[13px] text-[#7c7a75]">Portfolio, funnel and files needing attention</p>
        </div>
        <Link href="/partner/leads/new" className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20"><Plus size={11} strokeWidth={3} /></span>
          New lead
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHead
            title="Portfolio Overview"
            right={<span className="rounded-full bg-[#efeeeb] px-3 py-1 text-[11px] text-[#7c7a75]">Financial year to date</span>}
          />
          <CardBody>
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
              <div className="min-w-0">
                <p className="mb-1 text-[13px] text-[#7c7a75]">Assessment pass rate</p>
                <p className="flex items-baseline gap-2.5">
                  <span className="text-[44px] font-bold leading-none text-[#16161a] tnum">
                    {passRate != null ? `${passRate.toFixed(0)}%` : '—'}
                  </span>
                  <span className="text-[17px] font-medium text-[#5f5d58]">clearing policy</span>
                </p>

                <div className="mt-5">
                  <StatLine label="Disbursed value" value={fmtAmount(disbursedValue)} />
                  <StatLine label="Active pipeline" value={`${activePipeline.length} · ${fmtAmount(activePipelineValue)}`} />
                  <StatLine label="Average composite score" value={avgCompositeScore != null ? avgCompositeScore.toFixed(0) : '—'} />
                  <StatLine label="Average ticket" value={fmtAmount(avgTicket)} />
                </div>

                <div className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-[#efeeeb] py-2 pl-2 pr-4">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1a1917] text-white"><Check size={13} strokeWidth={3} /></span>
                  <span className="text-[12px] text-[#47453f]">
                    {reachRate != null
                      ? <><strong className="font-bold text-[#16161a] tnum">{reachRate.toFixed(0)}%</strong> of leads reach disbursal</>
                      : 'No leads yet.'}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                {radarAxes.length >= 3
                  ? <PillarRadar axes={radarAxes} size={280} />
                  : <p className="text-[12px] text-[#7c7a75]">Not enough assessed files to plot.</p>}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Products" right={<MoreHorizontal size={16} className="text-[#a8a6a0]" />} />
          <CardBody>
            {productTiles.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {productTiles.map(([type, { count, total }]) => (
                  <Link key={type} href={`/partner/leads?product=${type}`} className="rounded-[20px] bg-[#efeeeb] p-4 hover:bg-[#e3e2de]">
                    <div className="text-[13px] font-bold leading-tight text-[#16161a]">{LOAN_TYPE_LABEL[type] ?? type}</div>
                    <div className="mt-1 text-[11px] text-[#7c7a75] tnum">{count} lead{count === 1 ? '' : 's'}</div>
                    <div className="mt-3 truncate text-[15px] font-bold text-[#16161a] tnum">{fmtAmount(total)}</div>
                  </Link>
                ))}
                <Link href="/partner/leads" className="grid min-h-[112px] place-items-center rounded-[20px] bg-[#e3e2de] p-4 text-center text-[13px] font-semibold text-[#47453f] hover:bg-[#d8d6d0]">
                  See all leads
                </Link>
              </div>
            ) : (
              <Link href="/partner/leads/new" className="grid place-items-center rounded-[20px] bg-[#efeeeb] p-8 text-center hover:bg-[#e3e2de]">
                <span className="text-[13px] font-semibold text-[#16161a]">Create your first lead</span>
                <span className="mt-1 text-[11px] text-[#7c7a75]">Products will show up here once you have leads.</span>
              </Link>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead
            title="Pipeline funnel"
            sub="Leads by stage"
            right={<Link href="/partner/leads" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2440e8] hover:underline">All leads <ArrowRight size={12} /></Link>}
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {funnel.map((f) => {
                const max = Math.max(...funnel.map((x) => x.count), 1)
                return (
                  <div key={f.stage} className="min-w-0 rounded-[20px] bg-[#efeeeb] px-3.5 py-3">
                    <p className="text-[19px] font-bold leading-none text-[#16161a] tnum">{f.count}</p>
                    <p className="mt-1.5 truncate text-[11px] text-[#7c7a75]" title={STAGE_LABELS[f.stage]}>{STAGE_LABELS[f.stage]}</p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#e3e2de]">
                      <div className="h-full rounded-full bg-[#2440e8]" style={{ width: `${Math.max(2, (f.count / max) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Needs attention" sub="Assessment did not clear" icon={<AlertCircle size={16} />} />
          <div className="max-h-[320px] divide-y divide-[#e7e6e2] overflow-y-auto">
            {needsAttention.length === 0 && <p className="px-6 py-8 text-center text-[12px] text-[#a8a6a0]">Everything clear.</p>}
            {needsAttention.map(({ lead, a }) => (
              <Link key={lead.id} href={`/partner/leads/${lead.id}`} className="block px-6 py-3.5 hover:bg-[#efeeeb]">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[12px] font-semibold text-[#16161a]">{lead.client_name}</p>
                  <Badge className={VERDICT_STYLES[a.verdict]}>{a.verdict}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-[#7c7a75]">
                  {reasonByLead.get(lead.id) ?? (a.knockouts?.length ? `${a.knockouts.length} knockout(s) · ${a.knockouts[0]}` : 'Below policy threshold')}
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHead
            title="Recent Leads"
            sub="Most recently created"
            right={<Link href="/partner/leads" className="text-[13px] font-semibold text-[#5f5d58] hover:text-[#16161a]">See all</Link>}
          />
          <div className="divide-y divide-[#e7e6e2]">
            {recentLeads.length === 0 && <p className="px-6 py-8 text-center text-[13px] text-[#a8a6a0]">No leads yet.</p>}
            {recentLeads.map((l) => {
              const a = latestByLead.get(l.id)
              const ageDays = Math.floor((Date.now() - new Date(l.created_at).getTime()) / 86400000)
              return (
                <Link key={l.id} href={`/partner/leads/${l.id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#efeeeb]">
                  <Avatar name={l.client_name} size={38} />
                  <div className="min-w-0 w-[26%]">
                    <p className="truncate text-[13px] font-semibold text-[#16161a]">{l.client_name}</p>
                    <p className="truncate text-[11px] text-[#7c7a75]">{LOAN_TYPE_LABEL[l.loan_type] ?? l.loan_type}</p>
                  </div>
                  {a && <Badge className={BAND_STYLES[bandOf(a.composite_score)]}>{BAND_LABEL[bandOf(a.composite_score)]}</Badge>}
                  <p className="ml-auto shrink-0 text-[13px] font-bold text-[#16161a] tnum">{fmtAmount(Number(l.requested_amount))}</p>
                  <p className="hidden w-16 shrink-0 text-right text-[12px] text-[#7c7a75] tnum md:block">{ageDays}d</p>
                  {a
                    ? <Badge className={VERDICT_STYLES[a.verdict]}>{a.verdict}</Badge>
                    : <span className="text-[10.5px] text-[#a8a6a0]">Not assessed</span>}
                </Link>
              )
            })}
          </div>
        </Card>

        <PassRateByRm
          rows={rmRows}
          filesAssessed={assessed.length}
          viewAllHref="/partner/leads"
          scopeNote="Your own files — this view is scoped to the leads you own"
        />

        <Card className="lg:col-span-3">
          <CardHead title="Monthly disbursal" sub="Last 12 months, ₹ lakh" />
          <CardBody>
            <div className="flex items-end gap-[3px]" style={{ height: 96 }}>
              {monthly.map((m) => (
                <div key={m.key} className="group relative h-full flex-1" title={`₹${(m.total / 100000).toFixed(1)} L`}>
                  <div
                    className={`absolute bottom-0 w-full rounded-t-[4px] ${m.total === monthlyMax && m.total > 0 ? 'bg-[#2440e8]' : 'bg-[#c5cdf6]'}`}
                    style={{ height: `${Math.max(2, (m.total / monthlyMax) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2.5 grid grid-cols-12 text-[10.5px] font-medium text-[#7c7a75]">
              {monthly.map((m) => <span key={m.key} className="text-center">{m.label}</span>)}
            </div>
            {monthly.every((m) => m.total === 0) && (
              <p className="mt-2 text-[11px] text-[#a8a6a0]">No disbursals in the last 12 months.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHead
            title="Applicants"
            sub="Each customer, with every loan application they've asked for underneath"
            right={<Link href="/partner/applicants" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2440e8] hover:underline">See all <ArrowRight size={12} /></Link>}
          />
          {/* Full searchable list lives at /partner/applicants — this is a
              preview only, so it stays fast to scan once there are many. */}
          <div className="divide-y divide-[#e7e6e2]">
            {applicants.length === 0 && (
              <p className="px-6 py-8 text-center text-[13px] text-[#a8a6a0]">No applicants yet.</p>
            )}
            {applicants.slice(0, 5).map((applicant) => {
              const apps = applicationsByApplicant.get(applicant.id) ?? []
              return (
                <Link
                  key={applicant.id}
                  href={`/partner/applicants/${applicant.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#efeeeb]"
                >
                  <Avatar name={applicant.client_name} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#16161a]">{applicant.client_name}</p>
                    <p className="truncate text-[11px] text-[#7c7a75]">
                      {applicant.phone}{applicant.email ? ` · ${applicant.email}` : ''}
                      {applicant.agent_id !== user?.id && ` · ${nameByAgent.get(applicant.agent_id) ?? 'another partner'}'s file`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58] tnum">
                    {apps.length} application{apps.length === 1 ? '' : 's'}
                  </span>
                </Link>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
