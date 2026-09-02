'use client'

import { useActionState, useState } from 'react'
import { Pencil, Route } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { updateLeadSource } from '@/app/actions/applicantRelationship'
import { LEAD_SOURCE_CHANNELS, LEAD_SOURCE_LABEL, type Applicant } from '@/lib/types'

type State = { error?: string }

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] focus:border-[#16161a] focus:outline-none'

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className={`text-[12.5px] font-semibold ${value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{value ?? '—'}</p>
    </div>
  )
}

/**
 * Attribution — how this relationship was sourced. Its own small card rather
 * than extra fields on `ApplicantIdentityCard` because it writes through its
 * own action (`updateLeadSource`), but it reuses that card's exact
 * click-to-edit pattern rather than inventing a third one.
 */
export function AttributionCard({ applicant, isOwn }: { applicant: Applicant; isOwn: boolean }) {
  const [editing, setEditing] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateLeadSource(applicant.id, formData)
    if (!result?.error) setEditing(false)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  if (!editing) {
    return (
      <Card>
        <CardHead
          title="Attribution"
          sub="How this relationship was sourced"
          icon={<Route size={16} />}
          right={isOwn ? (
            <button
              type="button" onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
            >
              <Pencil size={12} /> Edit
            </button>
          ) : undefined}
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field
              label="Lead source"
              value={applicant.lead_source_channel ? LEAD_SOURCE_LABEL[applicant.lead_source_channel] : null}
            />
            <Field label="Referring partner" value={applicant.referring_partner} />
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHead title="Attribution" sub="How this relationship was sourced" icon={<Route size={16} />} />
      <CardBody>
        <form action={formAction}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Lead source</label>
              <select name="lead_source_channel" defaultValue={applicant.lead_source_channel ?? ''} className={inputClass}>
                <option value="">Not recorded</option>
                {LEAD_SOURCE_CHANNELS.map((c) => <option key={c} value={c}>{LEAD_SOURCE_LABEL[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Referring partner</label>
              <input name="referring_partner" defaultValue={applicant.referring_partner ?? ''} className={inputClass} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={pending} className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]">
              Cancel
            </button>
            {state?.error && <span className="text-[12px] text-red-600">{state.error}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
