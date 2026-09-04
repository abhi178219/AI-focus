'use client'

import { useActionState, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { updateReportingHierarchy } from '@/app/actions/profileHierarchy'

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

export interface RmDetails {
  full_name: string | null
  email: string | null
  phone: string | null
  region: string | null
  team_manager_name: string | null
  team_manager_phone: string | null
  business_head_name: string | null
  business_head_phone: string | null
}

/**
 * "Relationship manager" card on the Applicant page. The RM's own identity
 * (name/region/phone/email) is read-only here — it comes from their own
 * `profiles` row, not something to change from a customer's file. Team
 * Manager / Business Head are the RM's escalation contacts, editable inline:
 * plain name/phone facts, not accounts, since this app has no distinct
 * manager role to look one up against.
 *
 * `canEdit` is true for the RM themselves or an ops admin — matches the RLS
 * (`profiles_update_self`/`profiles_update_ops`) this write goes through.
 */
export function RelationshipManagerCard({
  profileId, rm, canEdit, applicantPath,
}: {
  profileId: string
  rm: RmDetails | null
  canEdit: boolean
  applicantPath: string
}) {
  const [editing, setEditing] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateReportingHierarchy(profileId, applicantPath, formData)
    if (!result?.error) setEditing(false)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <Card>
      <CardHead
        title="Relationship manager"
        sub="Owns this file"
        right={canEdit && !editing ? (
          <button
            type="button" onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
          >
            <Pencil size={12} /> Edit reporting line
          </button>
        ) : undefined}
      />
      <CardBody>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Name" value={rm?.full_name ?? null} />
          <Field label="Region" value={rm?.region ?? null} />
          <Field label="Phone" value={rm?.phone ?? null} />
          <Field label="Email" value={rm?.email ?? null} />
        </div>

        {!editing ? (
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#e7e6e2] pt-3.5">
            <Field label="Team manager" value={rm?.team_manager_name ?? null} />
            <Field label="Business head" value={rm?.business_head_name ?? null} />
            {rm?.team_manager_phone && <Field label="Team manager phone" value={rm.team_manager_phone} />}
            {rm?.business_head_phone && <Field label="Business head phone" value={rm.business_head_phone} />}
          </div>
        ) : (
          <form action={formAction} className="mt-4 border-t border-[#e7e6e2] pt-3.5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Team manager</label>
                <input name="team_manager_name" defaultValue={rm?.team_manager_name ?? ''} placeholder="Name" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Team manager phone</label>
                <input name="team_manager_phone" defaultValue={rm?.team_manager_phone ?? ''} placeholder="10-digit mobile" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Business head</label>
                <input name="business_head_name" defaultValue={rm?.business_head_name ?? ''} placeholder="Name" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Business head phone</label>
                <input name="business_head_phone" defaultValue={rm?.business_head_phone ?? ''} placeholder="10-digit mobile" className={inputClass} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
                {pending ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={pending} className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]">
                Cancel
              </button>
              {state?.error && <span className="text-[12px] text-red-600">{state.error}</span>}
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  )
}
