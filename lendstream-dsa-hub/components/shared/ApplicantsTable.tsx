import Link from 'next/link'
import { Building2, MapPin, Mail, Phone, Plus } from 'lucide-react'
import { LOAN_TYPE_LABEL, STAGE_LABELS, VERDICT_STYLES, type Applicant, type Lead } from '@/lib/types'
import { fmtAmount } from '@/lib/format'
import { Avatar } from '@/components/shared/Avatar'

const MAX_CHIPS = 3

export interface ApplicantExtras {
  apps: Lead[]
  latestByLead: Map<string, { verdict: string; composite_score: number }>
  isOwn: boolean
  ownerName: string | null
}

/**
 * List view for potentially many Applicants — a flat, scannable table
 * (not the nested full-detail blocks the Dashboard preview uses), with
 * phone and email as their own columns per the user's explicit ask.
 */
export function ApplicantsTable({ rows, extras }: { rows: Applicant[]; extras: Map<string, ApplicantExtras> }) {
  return (
    <div className="overflow-x-auto rounded-[28px] bg-[#f7f6f4] elev">
      <table className="w-full min-w-[1140px] text-[13px]">
        <thead>
          <tr className="border-b border-[#dcdbd6] text-left text-[10.5px] uppercase tracking-wide text-[#7c7a75]">
            <th className="px-5 py-3 font-medium">Applicant</th>
            <th className="px-5 py-3 font-medium">Mobile</th>
            <th className="px-5 py-3 font-medium">Email</th>
            <th className="px-5 py-3 font-medium">Address</th>
            <th className="px-5 py-3 font-medium">Pincode</th>
            <th className="px-5 py-3 font-medium">Applications</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((applicant) => {
            const e = extras.get(applicant.id) ?? { apps: [], latestByLead: new Map(), isOwn: true, ownerName: null }
            const apps = [...e.apps].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
            const shown = apps.slice(0, MAX_CHIPS)
            const overflow = apps.length - shown.length
            return (
              <tr key={applicant.id} className="border-b border-[#dcdbd6]/70 last:border-0 hover:bg-[#efeeeb]/70">
                <td className="px-5 py-3.5">
                  <Link href={`/partner/applicants/${applicant.id}`} className="flex items-center gap-3">
                    <Avatar name={applicant.client_name} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#16161a] hover:underline">{applicant.client_name}</span>
                        {applicant.entity_type === 'COMPANY' && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#eef1fe] px-1.5 py-0.5 text-[9.5px] font-semibold text-[#2440e8]">
                            <Building2 size={9} /> Company
                          </span>
                        )}
                      </div>
                      {!e.isOwn && (
                        <div className="text-[11px] text-[#a8a6a0]">{e.ownerName ?? 'Another partner'}&apos;s file</div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 text-[#47453f] tnum">
                    <Phone size={12} className="shrink-0 text-[#a8a6a0]" /> {applicant.phone}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  {applicant.email ? (
                    <div className="flex items-center gap-1.5 text-[#47453f]">
                      <Mail size={12} className="shrink-0 text-[#a8a6a0]" />
                      <span className="max-w-[220px] truncate">{applicant.email}</span>
                    </div>
                  ) : (
                    <span className="text-[#a8a6a0]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  {applicant.residence_address ? (
                    <div className="flex items-center gap-1.5 text-[#47453f]" title={applicant.residence_address}>
                      <MapPin size={12} className="shrink-0 text-[#a8a6a0]" />
                      <span className="max-w-[200px] truncate">{applicant.residence_address}</span>
                    </div>
                  ) : (
                    <span className="text-[#a8a6a0]">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-[#47453f] tnum">{applicant.pincode ?? <span className="text-[#a8a6a0]">—</span>}</td>
                <td className="px-5 py-3.5">
                  {shown.length === 0 ? (
                    <span className="text-[11px] text-[#a8a6a0]">No applications on file</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {shown.map((l) => {
                        const a = e.latestByLead.get(l.id)
                        return (
                          <Link
                            key={l.id}
                            href={`/partner/leads/${l.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-medium text-[#47453f] hover:bg-[#e3e2de]"
                          >
                            {LOAN_TYPE_LABEL[l.loan_type] ?? l.loan_type}
                            {a ? (
                              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${VERDICT_STYLES[a.verdict as keyof typeof VERDICT_STYLES]}`}>{a.verdict}</span>
                            ) : (
                              <span className="text-[#a8a6a0]">{STAGE_LABELS[l.stage]}</span>
                            )}
                            <span className="tnum text-[#7c7a75]">{fmtAmount(Number(l.requested_amount))}</span>
                          </Link>
                        )
                      })}
                      {overflow > 0 && (
                        <span className="rounded-full bg-[#e3e2de] px-2 py-1 text-[11px] font-medium text-[#5f5d58] tnum">+{overflow} more</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {e.isOwn && (
                    <Link
                      href={`/partner/applicants/${applicant.id}/application/new`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
                    >
                      <Plus size={11} strokeWidth={3} /> New application
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-5 py-10 text-center text-[#a8a6a0]">No applicants match this search.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
