import Link from 'next/link'
import { ArrowUpRight, Phone } from 'lucide-react'
import {
  STAGE_LABELS, STAGE_DESCRIPTIONS, STAGE_PILL_STYLES, VERDICT_STYLES, type Lead,
} from '@/lib/types'
import { fmtAmount } from '@/lib/format'
import { Badge } from '@/components/shared/Badge'
import { Avatar } from '@/components/shared/Avatar'

export const PRODUCT_LABEL: Record<string, string> = {
  PL: 'Personal Loan', HL: 'Home Loan', LAP: 'Loan Against Property', BOTH: 'PL + HL',
}

export interface LeadRowExtras {
  assessment?: { verdict: string; composite_score: number; governing_capacity: number | null }
  docs?: { total: number; verified: number }
}

/** The prototype's leads table — colour-coded stage + descriptor, lead id, cap, doc progress. */
export function LeadsTable({
  rows, basePath, extras,
}: {
  rows: Lead[]
  basePath: string
  extras: Map<string, LeadRowExtras>
}) {
  const now = Date.now()
  return (
    <div className="overflow-x-auto rounded-[28px] bg-[#f7f6f4] elev">
      <table className="w-full min-w-[1040px] text-[13px]">
        <thead>
          <tr className="border-b border-[#dcdbd6] text-left text-[10.5px] uppercase tracking-wide text-[#7c7a75]">
            <th className="px-5 py-3 font-medium">Applicant</th>
            <th className="px-5 py-3 font-medium">Product</th>
            <th className="px-5 py-3 font-medium">Requirement</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Assessment</th>
            <th className="px-5 py-3 font-medium">Documents</th>
            <th className="px-5 py-3 font-medium">Age</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => {
            const e = extras.get(lead.id) ?? {}
            const docs = e.docs ?? { total: 0, verified: 0 }
            const ageDays = Math.floor((now - new Date(lead.created_at).getTime()) / 86400000)
            return (
              <tr key={lead.id} className="group cursor-pointer border-b border-[#dcdbd6]/70 last:border-0 hover:bg-[#efeeeb]/70">
                <td className="sticky left-0 z-[1] bg-[#f7f6f4] px-4 py-3 group-hover:bg-[#efeeeb]">
                  <Link href={`${basePath}/${lead.id}`} className="flex items-center gap-3">
                    <Avatar name={lead.client_name} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#16161a]">{lead.client_name}</div>
                      <div className="flex items-center gap-1 text-[11px] text-[#7c7a75]">
                        <Phone size={10} /> {lead.phone}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#16161a]">{PRODUCT_LABEL[lead.loan_type] ?? lead.loan_type}</div>
                  {/* Short display form of the real id — a truncation for
                      readability, not a fabricated value. Full uuid is in the href. */}
                  <div className="text-[11px] text-[#a8a6a0] tnum">lead-{lead.id.slice(0, 6)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#16161a] tnum">{fmtAmount(Number(lead.requested_amount))}</div>
                  <div className="text-[11px] text-[#7c7a75]">{lead.tenure_years ? `${lead.tenure_years} yr` : '—'}</div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STAGE_PILL_STYLES[lead.stage]}`}>
                    {STAGE_LABELS[lead.stage]}
                  </span>
                  <div className="mt-1 text-[10.5px] text-[#7c7a75]">{STAGE_DESCRIPTIONS[lead.stage]}</div>
                </td>
                <td className="px-5 py-3">
                  {e.assessment ? (
                    <div>
                      <Badge className={VERDICT_STYLES[e.assessment.verdict as keyof typeof VERDICT_STYLES]}>
                        {e.assessment.verdict} {Math.round(e.assessment.composite_score)}
                      </Badge>
                      {e.assessment.governing_capacity && (
                        <div className="mt-1 text-[11px] text-[#7c7a75] tnum">cap {fmtAmount(e.assessment.governing_capacity)}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#a8a6a0]">Not assessed</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-[#e3e2de]">
                      <div className="h-1.5 rounded-full bg-[#1a1917]" style={{ width: docs.total ? `${(docs.verified / docs.total) * 100}%` : '0%' }} />
                    </div>
                    <span className="text-[11px] text-[#7c7a75] tnum">{docs.verified}/{docs.total}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[11px] text-[#7c7a75] tnum">{ageDays}d</td>
                <td className="px-5 py-3">
                  <Link href={`${basePath}/${lead.id}`} className="text-[#7c7a75] hover:text-[#16161a]">
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="px-5 py-10 text-center text-[#a8a6a0]">No leads match these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
