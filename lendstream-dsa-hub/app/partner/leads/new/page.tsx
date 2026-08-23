'use client'

import { useActionState } from 'react'
import { createLead } from '@/app/actions/leads'

type State = { error?: string }

async function action(_prev: State, formData: FormData): Promise<State> {
  const result = await createLead(formData)
  return result ?? {}
}

const inputClass = 'w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none'
const labelClass = 'mb-1 block text-sm font-medium text-[#5f5d58]'

export default function NewLeadPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <div className="mx-auto max-w-2xl pt-6">
      <h1 className="text-[28px] font-bold text-[#16161a]">New lead</h1>
      <p className="mb-6 text-sm text-[#7c7a75]">Just enough to open the file — income, tenure, property and co-applicant details can be added on the Applicant tab, by hand or pulled from uploaded documents.</p>
      <form action={formAction} className="rounded-[28px] bg-[#f7f6f4] p-6 elev">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass} htmlFor="client_name">Client name</label>
            <input id="client_name" name="client_name" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Mobile</label>
            <input id="phone" name="phone" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pan_number">PAN</label>
            <input id="pan_number" name="pan_number" className={inputClass} />
          </div>
          <div>
            <label className={labelClass} htmlFor="loan_type">Loan type</label>
            <select id="loan_type" name="loan_type" className={inputClass}>
              <option value="PL">Personal Loan</option>
              <option value="HL">Home Loan</option>
              <option value="LAP">Loan Against Property</option>
              <option value="BOTH">PL + HL</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelClass} htmlFor="requested_amount">Requested amount (₹)</label>
            <input id="requested_amount" name="requested_amount" type="number" required className={inputClass} />
          </div>
        </div>

        {state?.error && <p className="mt-4 text-sm text-red-600" role="alert">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded-full bg-[#1a1917] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Creating…' : 'Create lead'}
        </button>
      </form>
    </div>
  )
}
