import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from '@/lib/types'
import { fmtAmount } from '@/lib/format'
import { LeadsFilterBar } from '@/components/shared/LeadsFilterBar'
import { LeadsTable, type LeadRowExtras } from '@/components/shared/LeadsTable'

const SEGMENTS = ['all', 'active', 'attention', 'stale'] as const
const SEGMENT_LABEL: Record<string, string> = {
  all: 'All leads', active: 'Active', attention: 'Needs attention', stale: 'Stale',
}
const STALE_DAYS = 14

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; segment?: string; product?: string }> }) {
  const { q = '', stage = '', segment = 'all', product = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (stage) query = query.eq('stage', stage)
  if (product) query = query.eq('loan_type', product)
  if (q) query = query.or(`client_name.ilike.%${q}%,phone.ilike.%${q}%,pan_number.ilike.%${q}%`)

  const { data: leads } = await query.returns<Lead[]>()
  const allRows = leads ?? []
  const leadIds = allRows.map((l) => l.id)

  const [{ data: assessments }, { data: documents }] = leadIds.length
    ? await Promise.all([
        supabase.from('assessments').select('lead_id, verdict, composite_score, governing_capacity, computed_at').in('lead_id', leadIds).order('computed_at', { ascending: false }),
        supabase.from('documents').select('lead_id, status').in('lead_id', leadIds),
      ])
    : [{ data: [] }, { data: [] }]

  const latestAssessment = new Map<string, { verdict: string; composite_score: number; governing_capacity: number | null }>()
  for (const a of assessments ?? []) if (!latestAssessment.has(a.lead_id)) latestAssessment.set(a.lead_id, a)

  const docCounts = new Map<string, { total: number; verified: number }>()
  for (const d of documents ?? []) {
    const c = docCounts.get(d.lead_id) ?? { total: 0, verified: 0 }
    c.total += 1
    if (d.status === 'verified') c.verified += 1
    docCounts.set(d.lead_id, c)
  }

  const now = Date.now()
  const isStale = (l: Lead) => !['DISBURSED', 'DROPPED'].includes(l.stage) && (now - new Date(l.updated_at).getTime()) / 86400000 > STALE_DAYS
  const segmentCounts = {
    all: allRows.length,
    active: allRows.filter((l) => !['DISBURSED', 'DROPPED'].includes(l.stage)).length,
    attention: allRows.filter((l) => ['REFER', 'DECLINE'].includes(latestAssessment.get(l.id)?.verdict ?? '')).length,
    stale: allRows.filter(isStale).length,
  }

  const rows = allRows.filter((l) => {
    if (segment === 'active') return !['DISBURSED', 'DROPPED'].includes(l.stage)
    if (segment === 'attention') return ['REFER', 'DECLINE'].includes(latestAssessment.get(l.id)?.verdict ?? '')
    if (segment === 'stale') return isStale(l)
    return true
  })
  const totalRequested = rows.reduce((s, l) => s + Number(l.requested_amount), 0)

  const extras = new Map<string, LeadRowExtras>(
    rows.map((l) => [l.id, {
      assessment: latestAssessment.get(l.id),
      docs: docCounts.get(l.id) ?? { total: 0, verified: 0 },
    }]),
  )

  const qs = (over: Record<string, string>) => {
    const p = new URLSearchParams()
    const merged = { segment, product, stage, q, ...over }
    if (merged.segment && merged.segment !== 'all') p.set('segment', merged.segment)
    if (merged.product) p.set('product', merged.product)
    if (merged.stage) p.set('stage', merged.stage)
    if (merged.q) p.set('q', merged.q)
    const s = p.toString()
    return s ? `/partner/leads?${s}` : '/partner/leads'
  }

  return (
    <div className="pt-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#16161a]">Leads</h1>
          <p className="text-[13px] text-[#7c7a75]">Every applicant, filtered and assessed</p>
        </div>
        <Link href="/partner/leads/new" className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20"><Plus size={11} strokeWidth={3} /></span>
          New lead
        </Link>
      </div>

      <div className="mb-3 flex w-fit gap-1 rounded-full bg-[#f7f6f4] p-1 elev">
        {SEGMENTS.map((s) => (
          <Link
            key={s}
            href={qs({ segment: s })}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
              segment === s ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#efeeeb]'
            }`}
          >
            {SEGMENT_LABEL[s]}
            {s !== 'all' && (
              <span className={`rounded-full px-1.5 text-[10.5px] font-bold tnum ${segment === s ? 'bg-white/20' : 'bg-[#e3e2de] text-[#47453f]'}`}>
                {segmentCounts[s]}
              </span>
            )}
          </Link>
        ))}
      </div>

      <LeadsFilterBar
        basePath="/partner/leads"
        segment={segment} product={product} stage={stage} q={q}
        summary={`${q ? `“${q}” · ` : ''}${rows.length} of ${allRows.length} · ${fmtAmount(totalRequested)} requested`}
      />

      <LeadsTable rows={rows} basePath="/partner/leads" extras={extras} />
    </div>
  )
}
