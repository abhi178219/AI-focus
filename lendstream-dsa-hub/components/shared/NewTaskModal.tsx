'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, ListChecks, X } from 'lucide-react'
import { createTask } from '@/app/actions/tasks'
import { fmtAmount } from '@/lib/format'

type State = { error?: string }

const fieldInputClass = 'w-full h-10 rounded-lg border-0 bg-[#efeeeb] px-3 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none focus:ring-2 focus:ring-[#2440e8]/15'
const labelClass = 'text-[11px] font-semibold text-[#47453f]'
const requiredMark = <span className="ml-0.5 text-[#b42318]">*</span>

interface ApplicantOption { id: string; client_name: string }
interface LeadOption { id: string; client_name: string; loan_type: string; requested_amount: number }

/**
 * Page-based modal matching AddKeyPersonnelModal/NewLeadModal's visual
 * language. When opened generically from the Tasks page, `applicants`/`leads`
 * are full pickers. When opened from an Applicant or Application page, the
 * relevant prefill prop locks that field to a fixed badge instead — no way
 * to accidentally attach the task to the wrong record.
 */
export function NewTaskModal({
  applicants, leads, closeHref,
  prefillApplicant, prefillLead,
}: {
  applicants: ApplicantOption[]
  leads: LeadOption[]
  closeHref: string
  prefillApplicant?: { id: string; client_name: string }
  prefillLead?: { id: string; client_name: string; loan_type: string; requested_amount: number }
}) {
  async function action(_prev: State, formData: FormData): Promise<State> {
    return (await createTask(closeHref, formData)) ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#dcdbd6] bg-[#f7f6f4] shadow-[0_12px_40px_-10px_rgba(28,25,20,0.16),0_4px_12px_-4px_rgba(28,25,20,0.08)] sm:max-w-[480px] sm:rounded-[28px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dde3fd] bg-[#eef1fe]">
              <ListChecks size={16} className="text-[#2440e8]" />
            </span>
            <div>
              <h1 id="new-task-title" className="text-[15px] font-bold leading-tight text-[#1a1917]">New task</h1>
              <p className="mt-0.5 text-[11px] text-[#7c7a75]">
                {prefillLead ? `For ${prefillLead.client_name}'s application` : prefillApplicant ? `For ${prefillApplicant.client_name}` : 'A follow-up or to-do'}
              </p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7c7a75] hover:bg-[#e3e2de] hover:text-[#47453f]">
            <X size={16} />
          </Link>
        </div>

        <form id="new-task-form" action={formAction} className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`} htmlFor="title">Title{requiredMark}</label>
              <input id="title" name="title" required placeholder="Call to collect bank statement" className={fieldInputClass} />
            </div>

            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="due_date">Due date</label>
              <input id="due_date" name="due_date" type="date" className={fieldInputClass} />
            </div>
            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="priority">Priority</label>
              <select id="priority" name="priority" defaultValue="MEDIUM" className={fieldInputClass}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`}>Applicant</label>
              {prefillApplicant ? (
                <>
                  <input type="hidden" name="applicant_id" value={prefillApplicant.id} />
                  <div className="flex h-10 items-center rounded-lg bg-[#efeeeb] px-3 text-[13px] font-medium text-[#16161a]">{prefillApplicant.client_name}</div>
                </>
              ) : (
                <select id="applicant_id" name="applicant_id" defaultValue="" className={fieldInputClass}>
                  <option value="">No applicant</option>
                  {applicants.map((a) => <option key={a.id} value={a.id}>{a.client_name}</option>)}
                </select>
              )}
            </div>

            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`}>Application</label>
              {prefillLead ? (
                <>
                  <input type="hidden" name="lead_id" value={prefillLead.id} />
                  <div className="flex h-10 items-center rounded-lg bg-[#efeeeb] px-3 text-[13px] font-medium text-[#16161a]">
                    {prefillLead.loan_type} · {fmtAmount(prefillLead.requested_amount)}
                  </div>
                </>
              ) : (
                <select id="lead_id" name="lead_id" defaultValue="" className={fieldInputClass}>
                  <option value="">No specific application</option>
                  {leads.map((l) => <option key={l.id} value={l.id}>{l.client_name} · {l.loan_type} · {fmtAmount(l.requested_amount)}</option>)}
                </select>
              )}
            </div>

            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`} htmlFor="notes">Notes</label>
              <textarea id="notes" name="notes" rows={2} placeholder="Optional detail" className="w-full rounded-lg border-0 bg-[#efeeeb] px-3 py-2 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none focus:ring-2 focus:ring-[#2440e8]/15" />
            </div>
          </div>

          {state?.error && <p className="mt-4 text-[12px] text-[#b42318]" role="alert">{state.error}</p>}
        </form>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-3.5">
          <button
            type="submit" form="new-task-form" disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? 'Adding…' : <>Add task <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
