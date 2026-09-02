'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Plus, X } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { recordConsent } from '@/app/actions/applicantRelationship'
import { CONSENT_TYPES, CONSENT_TYPE_LABEL, type ApplicantConsent, type ConsentType } from '@/lib/types'

type State = { error?: string }

const CAPTURE_CHANNELS = ['App', 'SMS', 'Email', 'WhatsApp', 'Physical form']

const selectClass = 'h-9 w-full rounded-lg bg-[#efeeeb] px-3 text-[13px] text-[#16161a]'

/**
 * Consent Centre — the current state of each of the three consents, plus a
 * capture form that always INSERTS a new row (see `recordConsent`): a fresh
 * capture supersedes the prior one by being the latest, so the history of what
 * was agreed and when is never overwritten.
 *
 * `latestByType` holds only the most recent row per consent type; a type with
 * no row at all reads "Not captured yet", never an assumed refusal.
 */
export function ConsentCenterCard({
  applicantId, latestByType, isOwn,
}: {
  applicantId: string
  latestByType: Partial<Record<ConsentType, ApplicantConsent>>
  isOwn: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await recordConsent(applicantId, formData)
    if (!result?.error) {
      setOpen(false)
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <Card>
      <CardHead
        title="Consent centre"
        sub="What this applicant has agreed to, and when"
        icon={<ShieldCheck size={16} />}
        right={isOwn ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
          >
            {open ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Capture consent</>}
          </button>
        ) : undefined}
      />
      <CardBody className="space-y-3">
        <div className="divide-y divide-[#e7e6e2]">
          {CONSENT_TYPES.map((t) => {
            const row = latestByType[t]
            return (
              <div key={t} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-[#16161a]">{CONSENT_TYPE_LABEL[t]}</p>
                  <p className="text-[11px] text-[#7c7a75]">
                    {row
                      ? `${new Date(row.captured_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${row.channel ? ` · ${row.channel}` : ''}`
                      : 'No record on file'}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    !row ? 'bg-[#efeeeb] text-[#7c7a75]'
                      : row.granted ? 'bg-[#e8f3ee] text-[#16694a]'
                      : 'bg-[#fbebeb] text-[#b42318]'
                  }`}
                >
                  {!row ? 'Not captured yet' : row.granted ? 'Granted' : 'Not granted'}
                </span>
              </div>
            )
          })}
        </div>

        {isOwn && open && (
          <form action={formAction} className="space-y-2.5 rounded-[20px] bg-[#efeeeb]/60 p-3.5">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">Consent</label>
                <select name="consent_type" required defaultValue="" className={selectClass}>
                  <option value="" disabled>Choose…</option>
                  {CONSENT_TYPES.map((t) => <option key={t} value={t}>{CONSENT_TYPE_LABEL[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">Decision</label>
                {/* No default — a consent record must reflect a real answer. */}
                <select name="granted" required defaultValue="" className={selectClass}>
                  <option value="" disabled>Choose…</option>
                  <option value="true">Granted</option>
                  <option value="false">Refused</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">Captured over</label>
                <select name="channel" defaultValue="" className={selectClass}>
                  <option value="">Not recorded</option>
                  {CAPTURE_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {state?.error && <p className="text-[12px] text-[#b42318]">{state.error}</p>}
            <div className="flex items-center gap-2">
              <button type="submit" disabled={pending} className="h-9 rounded-full bg-[#1a1917] px-4 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {pending ? 'Saving…' : 'Record consent'}
              </button>
              <p className="text-[11px] leading-snug text-[#7c7a75]">
                Recorded as a new entry — it supersedes the previous one without erasing it.
              </p>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
