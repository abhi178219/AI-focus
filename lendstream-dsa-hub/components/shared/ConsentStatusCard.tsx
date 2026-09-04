'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { CustomerLinkPanel } from '@/components/shared/CustomerLinkControls'
import { CONSENT_TYPES, CONSENT_TYPE_LABEL, type ApplicantConsent, type ConsentType } from '@/lib/types'

/**
 * Consent, on the sidebar of the Activity tab — where it replaced the old "CRM
 * sync" card, which reported on an integration this app doesn't have.
 *
 * The compact half reuses `ConsentCenterCard`'s exact visual language (Granted
 * / Not granted / **Not captured yet** — a missing row never reads as a
 * refusal), but this is a narrow sidebar card, not the full applicant-page one:
 * no capture form here. The two things it adds are a "Send consent link" button
 * and, behind "View more", the complete audit trail — every row, not just the
 * latest per type, newest first.
 */
export function ConsentStatusCard({
  leadId, applicantId, consents, isOwn,
}: {
  leadId: string
  /** The applicant these consents belong to — used to link through to the full
   *  Consent Centre, where a consent can also be captured by hand. */
  applicantId: string
  /** Full history, newest first. Latest-per-type is derived here rather than
   *  fetched twice — append-only, so "current" is simply the first row seen. */
  consents: ApplicantConsent[]
  isOwn: boolean
}) {
  const [showHistory, setShowHistory] = useState(false)

  const latestByType = useMemo(() => {
    const map: Partial<Record<ConsentType, ApplicantConsent>> = {}
    for (const c of consents) if (!map[c.consent_type]) map[c.consent_type] = c
    return map
  }, [consents])

  return (
    <Card>
      <CardHead
        title="Consent"
        sub="What the customer has agreed to"
        icon={<ShieldCheck size={16} />}
      />
      <CardBody className="space-y-3">
        <div className="divide-y divide-[#e7e6e2]">
          {CONSENT_TYPES.map((t) => {
            const row = latestByType[t]
            return (
              <div key={t} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[#16161a]">{CONSENT_TYPE_LABEL[t]}</p>
                  <p className="text-[11px] text-[#7c7a75]">
                    {row ? formatCaptured(row) : 'No record on file'}
                  </p>
                </div>
                <StatusPill row={row} />
              </div>
            )
          })}
        </div>

        {isOwn && <CustomerLinkPanel leadId={leadId} purpose="CONSENT" buttonLabel="Send consent link" />}

        <div className="border-t border-[#e7e6e2] pt-2.5">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#2440e8] hover:opacity-80"
          >
            {showHistory ? <>Hide history <ChevronUp size={14} /></> : <>View more <ChevronDown size={14} /></>}
          </button>

          {showHistory && (
            <div className="mt-2.5">
              <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">
                Full consent history
              </p>
              {consents.length === 0 ? (
                <p className="text-[12px] text-[#a8a6a0]">Nothing recorded yet.</p>
              ) : (
                <ul className="divide-y divide-[#e7e6e2]">
                  {consents.map((c) => (
                    <li key={c.id} className="flex items-start justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11.5px] font-medium text-[#16161a]">
                          {CONSENT_TYPE_LABEL[c.consent_type]}
                        </p>
                        <p className="text-[11px] text-[#7c7a75]">{formatCaptured(c)}</p>
                      </div>
                      <StatusPill row={c} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-[11px] leading-snug text-[#7c7a75]">
                Append-only — a newer entry supersedes an older one without erasing it.{' '}
                <Link href={`/partner/applicants/${applicantId}`} className="font-medium text-[#2440e8] hover:opacity-80">
                  Open the Consent Centre
                </Link>{' '}
                to record one by hand.
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function StatusPill({ row }: { row?: ApplicantConsent }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        !row ? 'bg-[#efeeeb] text-[#7c7a75]'
          : row.granted ? 'bg-[#e8f3ee] text-[#16694a]'
          : 'bg-[#fbebeb] text-[#b42318]'
      }`}
    >
      {!row ? 'Not captured yet' : row.granted ? 'Granted' : 'Not granted'}
    </span>
  )
}

function formatCaptured(row: ApplicantConsent) {
  const date = new Date(row.captured_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  return row.channel ? `${date} · ${row.channel}` : date
}
