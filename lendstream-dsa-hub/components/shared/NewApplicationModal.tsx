'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, X } from 'lucide-react'
import { createApplication } from '@/app/actions/leads'
import type { LoanType } from '@/lib/types'

type State = { error?: string }

const PRODUCTS: { value: LoanType; label: string }[] = [
  { value: 'PL', label: 'Personal Loan' },
  { value: 'BL', label: 'Business Loan' },
  { value: 'WC', label: 'Working Capital' },
  { value: 'HL', label: 'Home Loan' },
  { value: 'LAP', label: 'Loan Against Property' },
  { value: 'BOTH', label: 'PL + HL' },
]

const AMOUNT_CHIPS = [
  { label: '₹5.00 L', value: 500000 },
  { label: '₹10.00 L', value: 1000000 },
  { label: '₹25.00 L', value: 2500000 },
  { label: '₹50.00 L', value: 5000000 },
]

const fieldInputClass = 'w-full h-10 rounded-lg border-0 bg-[#efeeeb] px-3 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none focus:ring-2 focus:ring-[#2440e8]/15'
const labelClass = 'text-[11px] font-semibold text-[#47453f]'
const requiredMark = <span className="ml-0.5 text-[#b42318]">*</span>

// Reuses the New lead modal's exact visual language (see NewLeadModal.tsx,
// matched to the prototype) but asks only for Product + Amount — identity
// fields already live on the Applicant and aren't re-entered. Reached from
// the Applicant's own row on the Dashboard, the Applicants list, or their
// own detail page — closeHref sends it back to wherever that actually was.
export function NewApplicationModal({ applicantId, applicantName, closeHref }: { applicantId: string; applicantName: string; closeHref: string }) {
  const [product, setProduct] = useState<LoanType>('PL')
  const [amount, setAmount] = useState('')

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await createApplication(applicantId, formData)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-application-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#dcdbd6] bg-[#f7f6f4] shadow-[0_12px_40px_-10px_rgba(28,25,20,0.16),0_4px_12px_-4px_rgba(28,25,20,0.08)] sm:max-w-[480px] sm:rounded-[28px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dde3fd] bg-[#eef1fe]">
              <Briefcase size={16} className="text-[#2440e8]" />
            </span>
            <div>
              <h1 id="new-application-title" className="text-[15px] font-bold leading-tight text-[#1a1917]">New application</h1>
              <p className="mt-0.5 text-[11px] text-[#7c7a75]">For {applicantName} — a second product on the same file.</p>
            </div>
          </div>
          <Link
            href={closeHref}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7c7a75] hover:bg-[#e3e2de] hover:text-[#47453f]"
          >
            <X size={16} />
          </Link>
        </div>

        <form id="new-application-form" action={formAction} className="px-5 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className={`${labelClass} mb-1.5 block`}>Product{requiredMark}</label>
              <input type="hidden" name="loan_type" value={product} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRODUCTS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={product === p.value}
                    onClick={() => setProduct(p.value)}
                    className={`h-9 rounded-lg border px-2 text-[12px] font-semibold transition-colors ${
                      product === p.value
                        ? 'border-[#2440e8] bg-[#2440e8] text-white'
                        : 'border-[#dcdbd6] bg-[#f7f6f4] text-[#5f5d58] hover:bg-[#efeeeb]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`${labelClass} mb-1.5 block`} htmlFor="requested_amount">Amount required{requiredMark}</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#5f5d58]">₹</span>
                <input
                  id="requested_amount"
                  name="requested_amount"
                  type="number"
                  required
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="15,00,000"
                  className={`${fieldInputClass} tnum pl-7`}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {AMOUNT_CHIPS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={amount === String(c.value)}
                    onClick={() => setAmount(String(c.value))}
                    className={`tnum h-7 rounded-lg border px-2.5 text-[11px] font-medium transition-colors ${
                      amount === String(c.value)
                        ? 'border-[#2440e8] bg-[#2440e8] text-white'
                        : 'border-[#dcdbd6] bg-[#f7f6f4] text-[#5f5d58] hover:bg-[#efeeeb]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {state?.error && <p className="mt-4 text-[12px] text-[#b42318]" role="alert">{state.error}</p>}
        </form>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-3.5">
          <button
            type="submit"
            form="new-application-form"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? 'Creating…' : <>Create &amp; open <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
