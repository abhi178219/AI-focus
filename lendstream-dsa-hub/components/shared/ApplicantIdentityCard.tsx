'use client'

import { useActionState, useState } from 'react'
import { Building2, Pencil } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { updateApplicant } from '@/app/actions/applicants'
import { markApplicantAsCompany } from '@/app/actions/keyPersonnel'
import type { Applicant } from '@/lib/types'

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
 * Read-view-with-click-to-edit, same pattern as the lead's own Applicant
 * tab (ApplicantPanel.tsx). `panNumber` is the effective value the page
 * already computed (falls back to a lead's PAN if the Applicant's own is
 * empty) — editing and saving here writes it directly onto the Applicant,
 * so it stops needing that fallback afterwards.
 */
export function ApplicantIdentityCard({
  applicant, isCompany, isOwn, panNumber,
}: {
  applicant: Applicant
  isCompany: boolean
  isOwn: boolean
  panNumber: string | null
}) {
  const [editing, setEditing] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateApplicant(applicant.id, formData)
    if (!result?.error) setEditing(false)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  if (!editing) {
    return (
      <Card className="lg:col-span-2">
        <CardHead
          title={isCompany ? 'Company' : 'Applicant'}
          sub={isCompany ? 'Registered details' : 'Identity captured at intake'}
          right={isOwn ? (
            <div className="flex items-center gap-2">
              {!isCompany && (
                <form action={markApplicantAsCompany}>
                  <input type="hidden" name="applicant_id" value={applicant.id} />
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
                    <Building2 size={12} /> Mark as company
                  </button>
                </form>
              )}
              <button
                type="button" onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
              >
                <Pencil size={12} /> Edit
              </button>
            </div>
          ) : undefined}
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            <Field label={isCompany ? 'Company name' : 'Full name'} value={applicant.client_name} />
            <Field label="PAN" value={panNumber} />
            <Field label="Mobile" value={applicant.phone} />
            <Field label="Email" value={applicant.email} />
            <div className="col-span-2 sm:col-span-4">
              <Field label="Address" value={applicant.residence_address} />
            </div>
            <Field label="Pincode" value={applicant.pincode} />
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="lg:col-span-2">
      <CardHead title={isCompany ? 'Company' : 'Applicant'} sub={isCompany ? 'Registered details' : 'Identity captured at intake'} />
      <CardBody>
        <form action={formAction}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-2 sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">{isCompany ? 'Company name' : 'Full name'}</label>
              <input name="client_name" required defaultValue={applicant.client_name} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Mobile</label>
              <input name="phone" required defaultValue={applicant.phone} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">PAN</label>
              <input name="pan_number" defaultValue={panNumber ?? ''} className={`${inputClass} uppercase`} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Email</label>
              <input name="email" type="email" defaultValue={applicant.email ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Pincode</label>
              <input name="pincode" defaultValue={applicant.pincode ?? ''} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-2 lg:col-span-4">
              <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Address</label>
              <input name="residence_address" defaultValue={applicant.residence_address ?? ''} className={inputClass} />
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
