import Link from 'next/link'
import { Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CommissionCalculator } from '@/components/shared/CommissionCalculator'
import { LEAD_STAGES, STAGE_LABELS, type Lead } from '@/lib/types'
import { fmtAmount } from '@/lib/format'

const RANGES = [
  { key: 'month', label: 'This Month' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
  { key: 'ytd', label: 'YTD' },
] as const

function rangeStart(key: string): Date {
  const now = new Date()
  if (key === '30d') return new Date(now.getTime() - 30 * 86400000)
  if (key === '90d') return new Date(now.getTime() - 90 * 86400000)
  if (key === 'ytd') return new Date(now.getFullYear(), 0, 1)
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = 'month' } = await searchParams
  const activeRange = RANGES.some((r) => r.key === range) ? range : 'month'
  const since = rangeStart(activeRange)

  const supabase = await createClient()
  const { data: allLeads } = await supabase.from('leads').select('*').returns<Lead[]>()
  const allRows = allLeads ?? []
  const rows = allRows.filter((l) => new Date(l.created_at) >= since)

  const funnel = LEAD_STAGES.filter((s) => s !== 'DROPPED').map((stage) => ({ stage, count: rows.filter((l) => l.stage === stage).length }))

  const byBank = new Map<string, number>()
  for (const l of rows) {
    if (l.bank_assigned && l.disbursed_amount) byBank.set(l.bank_assigned, (byBank.get(l.bank_assigned) ?? 0) + l.disbursed_amount)
  }

  const { data: slabs } = await supabase.from('commission_slabs').select('*').order('bank_name')

  // Partner display names for the pass-rate breakdown. RLS decides which of
  // these are readable; an unreadable one falls back to a short id.
  const passRateAgentIds = [...new Set(rows.map((l) => l.agent_id))]
  const { data: agentProfileRows } = passRateAgentIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', passRateAgentIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const agentNameById = new Map((agentProfileRows ?? []).map((p) => [p.id, p.full_name ?? null]))

  // Pivot slabs to one row per bank with a PL / HL rate range, as the prototype.
  // A bank with no slab in a category shows "N/A" — never an assumed rate.
  const slabRows = (slabs ?? []) as {
    bank_name: string; product_category: string; commission_percent: number; payout_cycle: string | null
  }[]
  const byBankRate = new Map<string, { pl: number[]; hl: number[]; cycle: string | null }>()
  for (const s of slabRows) {
    const e = byBankRate.get(s.bank_name) ?? { pl: [], hl: [], cycle: null }
    if (s.product_category === 'PL') e.pl.push(Number(s.commission_percent))
    if (s.product_category === 'HL') e.hl.push(Number(s.commission_percent))
    e.cycle = e.cycle ?? s.payout_cycle ?? null
    byBankRate.set(s.bank_name, e)
  }
  const rateRange = (v: number[]) =>
    v.length === 0 ? null
      : v.length === 1 || Math.min(...v) === Math.max(...v)
        ? `${v[0].toFixed(2)}%`
        : `${Math.min(...v).toFixed(2)}% – ${Math.max(...v).toFixed(2)}%`
  const bankRows = [...byBankRate.entries()]
    .map(([bank, e]) => ({ bank, pl: rateRange(e.pl), hl: rateRange(e.hl), cycle: e.cycle }))
    .sort((a, b) => a.bank.localeCompare(b.bank))

  const disbursedLeads = rows.filter((l) => l.stage === 'DISBURSED' && l.disbursed_amount)
  const totalDisbursed = disbursedLeads.reduce((s, l) => s + Number(l.disbursed_amount), 0)
  const earnedCommission = disbursedLeads.reduce((sum, l) => {
    const category = l.loan_type === 'BOTH' ? 'PL' : l.loan_type
    const match = (slabs ?? []).find((s) =>
      s.product_category === category && s.bank_name === l.bank_assigned
      && Number(l.disbursed_amount) >= s.slab_min_amount && (s.slab_max_amount == null || Number(l.disbursed_amount) <= s.slab_max_amount))
    return sum + (match ? Number(l.disbursed_amount) * match.commission_percent / 100 : 0)
  }, 0)
  const avgCommissionPercent = totalDisbursed > 0 ? (earnedCommission / totalDisbursed) * 100 : 0
  const sanctionedPipelineValue = rows.filter((l) => l.stage === 'SANCTIONED').reduce((s, l) => s + Number(l.requested_amount), 0)
  const loggedOrBeyond = rows.filter((l) => ['LOGGED_IN', 'SANCTIONED', 'DISBURSED'].includes(l.stage)).length
  const logConversionRate = rows.length ? (loggedOrBeyond / rows.length) * 100 : 0

  const leadIds = rows.map((l) => l.id)
  const { data: assessments } = leadIds.length
    ? await supabase.from('assessments').select('lead_id, verdict, computed_at').in('lead_id', leadIds).order('computed_at', { ascending: false })
    : { data: [] }
  const latestByLead = new Map<string, string>()
  for (const a of assessments ?? []) if (!latestByLead.has(a.lead_id)) latestByLead.set(a.lead_id, a.verdict)

  const byAgent = new Map<string, { pass: number; total: number }>()
  for (const l of rows) {
    const verdict = latestByLead.get(l.id)
    if (!verdict) continue
    const entry = byAgent.get(l.agent_id) ?? { pass: 0, total: 0 }
    entry.total += 1
    if (verdict === 'PASS') entry.pass += 1
    byAgent.set(l.agent_id, entry)
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#16161a]">Analytics</h1>
          <p className="text-sm text-[#7c7a75]">Conversion, disbursal and commission</p>
        </div>
        <Link href="/partner/leads/new" className="rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90">
          + New lead
        </Link>
      </div>

      <div className="flex w-fit gap-1 rounded-full bg-white p-1 shadow-sm">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/partner/analytics?range=${r.key}`}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${activeRange === r.key ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#efeeeb]'}`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="rounded-[28px] bg-gradient-to-br from-[#1a1917] via-[#2a2825] to-[#1a1917] p-6 text-white shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#d6f34b]">LendStream DSA Business Intelligence</div>
            <h2 className="text-xl font-bold">Agent Analytics &amp; Commission Intelligence</h2>
            <p className="mt-1 max-w-md text-xs text-white/50">Real-time insight into disbursals, bank payout commissions, pipeline conversion, and earnings.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#16161a]">
            <Download size={13} /> Export CSV
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <HeroStat label="Total disbursed" value={fmtAmount(totalDisbursed)} sublabel={`${disbursedLeads.length} loans disbursed`} />
          <HeroStat label="Earned commission" value={fmtAmount(Math.round(earnedCommission))} sublabel={`Avg commission: ${avgCommissionPercent.toFixed(2)}%`} />
          <HeroStat label="Sanctioned pipeline" value={fmtAmount(sanctionedPipelineValue)} sublabel="Est. pending payout" />
          <HeroStat label="Log conversion rate" value={`${logConversionRate.toFixed(0)}%`} sublabel="Lead-to-log ratio" />
        </div>
      </div>

      <section className="rounded-[28px] bg-[#f7f6f4] p-6 elev">
        <h2 className="mb-4 text-sm font-medium text-[#16161a]">Pipeline Stage Breakdown &amp; Funnel</h2>
        <div className="space-y-2">
          {funnel.map((f) => {
            const max = Math.max(...funnel.map((x) => x.count), 1)
            const value = rows.filter((l) => l.stage === f.stage).reduce((s, l) => s + l.requested_amount, 0)
            return (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="w-32 text-xs text-[#7c7a75]">{STAGE_LABELS[f.stage]}</span>
                <div className="h-3 flex-1 rounded-full bg-[#efeeeb]">
                  <div className="h-3 rounded-full bg-[#1a1917]" style={{ width: `${(f.count / max) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-xs font-medium text-[#5f5d58]">{f.count}</span>
                <span className="w-20 text-right text-xs text-[#c9c7c1]">₹{(value / 100000).toFixed(1)}L</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-6">
        <section className="rounded-[28px] bg-[#f7f6f4] p-6 elev">
          <h2 className="mb-4 text-sm font-medium text-[#16161a]">Partner Bank Disbursement Distribution</h2>
          {byBank.size === 0 && <p className="text-sm text-[#c9c7c1]">No disbursed leads yet.</p>}
          <div className="space-y-2">
            {[...byBank.entries()].map(([bank, amount]) => (
              <div key={bank} className="flex items-center justify-between rounded-2xl bg-[#efeeeb] px-4 py-2 text-sm">
                <span className="font-medium text-[#16161a]">{bank}</span>
                <span className="text-[#5f5d58]">₹{(amount / 100000).toFixed(2)} L</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] bg-[#f7f6f4] p-6 elev">
          <h2 className="mb-4 text-sm font-medium text-[#16161a]">Pass Rate by Partner</h2>
          {byAgent.size === 0 && <p className="text-sm text-[#c9c7c1]">No assessed leads yet.</p>}
          <div className="space-y-2">
            {[...byAgent.entries()].map(([agentId, { pass, total }]) => (
              <div key={agentId} className="flex items-center justify-between rounded-2xl bg-[#efeeeb] px-4 py-2 text-sm">
                <span className="font-medium text-[#16161a]">{agentNameById.get(agentId) ?? `${agentId.slice(0, 8)}…`}</span>
                <span className="text-[#5f5d58]">{pass}/{total} ({((pass / total) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CommissionCalculator slabs={slabs ?? []} />

      <section className="rounded-[28px] bg-[#f7f6f4] p-6 elev">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#16161a]">Bank commission slab structure &amp; payout rates</h2>
            <p className="text-[11px] text-[#7c7a75]">Standard payout percentages offered by partner banks for DSAs</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#e8f3ee] px-2.5 py-1 text-[11px] font-semibold text-[#16694a]">
            {bankRows.length} configured
          </span>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] text-[12.5px]">
            <thead>
              <tr className="border-b border-[#dcdbd6] text-left text-[10px] uppercase tracking-wide text-[#7c7a75]">
                <th className="py-2.5 font-medium">Partner bank</th>
                <th className="py-2.5 font-medium">Personal loan (PL)</th>
                <th className="py-2.5 font-medium">Home loan (HL)</th>
                <th className="py-2.5 font-medium">Payout cycle</th>
                <th className="py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bankRows.map((b) => (
                <tr key={b.bank} className="border-b border-[#e7e6e2] last:border-0">
                  <td className="py-2.5 font-semibold text-[#16161a]">{b.bank}</td>
                  <td className={`py-2.5 tnum ${b.pl ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>{b.pl ?? 'N/A'}</td>
                  <td className={`py-2.5 tnum ${b.hl ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>{b.hl ?? 'N/A'}</td>
                  <td className={`py-2.5 ${b.cycle ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>{b.cycle ?? '—'}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-[#e8f3ee] px-2 py-0.5 text-[11px] font-semibold text-[#16694a]">Active</span>
                  </td>
                </tr>
              ))}
              {bankRows.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-[#c9c7c1]">No commission slabs configured yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function HeroStat({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mb-1 text-lg font-bold">{value}</div>
      <div className="text-[11px] text-white/40">{sublabel}</div>
    </div>
  )
}
