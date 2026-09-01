'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowRight, UserPlus, X } from 'lucide-react'
import { addKeyPersonnel } from '@/app/actions/keyPersonnel'

type State = { error?: string }

const fieldInputClass = 'w-full h-10 rounded-lg border-0 bg-[#efeeeb] px-3 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none focus:ring-2 focus:ring-[#2440e8]/15'
const labelClass = 'text-[11px] font-semibold text-[#47453f]'
const requiredMark = <span className="ml-0.5 text-[#b42318]">*</span>
const hintClass = 'text-[11px] font-medium text-[#7c7a75]'

// Same visual language as NewLeadModal/NewApplicationModal — the key person
// becomes a full individual Applicant, so this collects the same identity
// fields "New lead" does, plus their role at the company.
export function AddKeyPersonnelModal({ companyApplicantId, companyName, closeHref }: { companyApplicantId: string; companyName: string; closeHref: string }) {
  async function action(_prev: State, formData: FormData): Promise<State> {
    return (await addKeyPersonnel(companyApplicantId, formData)) ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-key-personnel-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#dcdbd6] bg-[#f7f6f4] shadow-[0_12px_40px_-10px_rgba(28,25,20,0.16),0_4px_12px_-4px_rgba(28,25,20,0.08)] sm:max-w-[480px] sm:rounded-[28px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dde3fd] bg-[#eef1fe]">
              <UserPlus size={16} className="text-[#2440e8]" />
            </span>
            <div>
              <h1 id="add-key-personnel-title" className="text-[15px] font-bold leading-tight text-[#1a1917]">Add key personnel</h1>
              <p className="mt-0.5 text-[11px] text-[#7c7a75]">For {companyName} — director, partner or authorized signatory.</p>
            </div>
          </div>
          <Link href={closeHref} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7c7a75] hover:bg-[#e3e2de] hover:text-[#47453f]">
            <X size={16} />
          </Link>
        </div>

        <form id="add-key-personnel-form" action={formAction} className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`} htmlFor="client_name">Full name{requiredMark}</label>
              <input id="client_name" name="client_name" required placeholder="Full name as on PAN" className={fieldInputClass} />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className={labelClass} htmlFor="phone">Mobile number{requiredMark}</label>
                <span className={hintClass}>10 digits</span>
              </div>
              <input
                id="phone" name="phone" required inputMode="numeric" placeholder="98765 43210" className={fieldInputClass}
                onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10) }}
              />
            </div>
            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="designation">Designation</label>
              <input id="designation" name="designation" placeholder="Director" className={fieldInputClass} />
            </div>

            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="pan_number">PAN</label>
              <input id="pan_number" name="pan_number" placeholder="ABCDE1234F" className={`${fieldInputClass} uppercase placeholder:normal-case`} />
            </div>
            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="name@example.com" className={fieldInputClass} />
            </div>
          </div>

          {state?.error && <p className="mt-4 text-[12px] text-[#b42318]" role="alert">{state.error}</p>}
        </form>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-3.5">
          <button
            type="submit" form="add-key-personnel-form" disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? 'Adding…' : <>Add key personnel <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
