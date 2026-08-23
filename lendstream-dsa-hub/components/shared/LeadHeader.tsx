import Link from 'next/link'
import { Phone, StickyNote, FileText, Send } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import {
  STAGE_LABELS, STAGE_DESCRIPTIONS, STAGE_PILL_STYLES, VERDICT_STYLES,
  type Lead, type Assessment,
} from '@/lib/types'
import { fmtAmount } from '@/lib/format'

/**
 * Lead header: identity row + primary actions + the five-cell metric strip,
 * matching the prototype.
 *
 * The header carries exactly three actions — Note, Banker summary, Submit to
 * lender. Stage is shown as a pill beside the name and is CHANGED from the
 * File journey rail on the Overview tab; a stage picker up here would be a
 * second, competing control the prototype does not have.
 *
 * The "Assessed capacity" cell is emphasised because it is the number that
 * decides whether the ask is fundable.
 */
export function LeadHeader({
  lead, leadId, basePath, assessment,
}: {
  lead: Lead
  leadId: string
  basePath: string
  assessment: Assessment | null
}) {
  const bindingConstraint = assessment?.binding_constraint ?? null

  return (
    <section className="bg-[#f7f6f4] rounded-[28px] elev overflow-hidden mb-4">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <Avatar name={lead.client_name} size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[19px] font-bold text-[#16161a] leading-tight">{lead.client_name}</h1>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${STAGE_PILL_STYLES[lead.stage]}`}>
                  {STAGE_LABELS[lead.stage]}
                </span>
                <span className="text-[11px] text-[#7c7a75]">{STAGE_DESCRIPTIONS[lead.stage]}</span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[#5f5d58]">
                <Phone size={12} className="text-[#7c7a75]" />
                {lead.phone || '—'} · lead-{leadId.slice(0, 6)} · {lead.loan_type || '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`${basePath}/${leadId}?tab=activity`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 py-2 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
            >
              <StickyNote size={14} /> Note
            </Link>
            <Link
              href={`${basePath}/${leadId}/cam`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 py-2 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
            >
              <FileText size={14} /> Banker summary
            </Link>
            <Link
              href={`${basePath}/${leadId}?tab=offers`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-3.5 py-2 text-[12px] font-semibold text-white hover:opacity-90"
            >
              <Send size={14} /> Submit to lender
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          <Metric
            label="Requested"
            value={fmtAmount(Number(lead.requested_amount))}
            sub={lead.tenure_years ? `${lead.tenure_years} years` : 'Tenure not set'}
          />
          <Metric
            label="Assessed capacity"
            value={assessment?.governing_capacity ? fmtAmount(assessment.governing_capacity) : '—'}
            sub={bindingConstraint ?? (assessment ? 'No binding constraint' : 'Not assessed yet')}
            emphasis
          />
          <Metric
            label="Indicative EMI"
            value={assessment?.proposed_emi ? `₹${Math.round(assessment.proposed_emi).toLocaleString('en-IN')}` : '—'}
            sub="At proposed terms"
          />
          <Metric
            label="DSCR"
            value={assessment?.dscr != null ? assessment.dscr.toFixed(2) : '—'}
            sub={assessment?.dscr != null ? 'Floor 1.25' : 'Needs income + EMI'}
          />
          <div className="rounded-[20px] border border-[#dcdbd6] bg-[#f7f6f4] px-4 py-3 flex items-center gap-3">
            {assessment ? (
              <>
                <Ring score={assessment.composite_score} verdict={assessment.verdict} />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Assessment</p>
                  <p className={`text-[15px] font-bold ${VERDICT_STYLES[assessment.verdict].split(' ').find((c) => c.startsWith('text-'))}`}>
                    {assessment.verdict}
                  </p>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Assessment</p>
                <p className="text-[12px] text-[#7c7a75] leading-snug">Not run yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, sub, emphasis }: { label: string; value: string; sub?: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-[20px] border px-4 py-3 min-w-0 ${emphasis ? 'border-[#dcdbd6] bg-[#efeeeb]' : 'border-[#dcdbd6] bg-[#f7f6f4]'}`}>
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className="text-[18px] font-bold text-[#16161a] tnum leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[10.5px] text-[#7c7a75] mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function Ring({ score, verdict }: { score: number; verdict: 'PASS' | 'REFER' | 'DECLINE' }) {
  const r = 22
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, score) / 100)
  const stroke = verdict === 'PASS' ? '#1a7f5a' : verdict === 'REFER' ? '#a06a10' : '#b3323f'
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e3e2de" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={stroke} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[15px] font-bold text-[#16161a] tnum">
        {Math.round(score)}
      </div>
    </div>
  )
}
