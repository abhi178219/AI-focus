'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Plus, User, X } from 'lucide-react'
import { createLead } from '@/app/actions/leads'
import type { LoanType } from '@/lib/types'

type State = { error?: string; success?: string }

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

// Matches the prototype exactly (`preview.html`'s New lead dialog, computed
// styles sampled directly): 11px semibold labels, borderless inputs on
// surface-2, 8px radii everywhere (not the app's usual 28px card curve —
// this is a compact form, not a section card), h-10/h-9 controls.
const fieldInputClass = 'w-full h-10 rounded-lg border-0 bg-[#efeeeb] px-3 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none focus:ring-2 focus:ring-[#2440e8]/15'
const labelClass = 'text-[11px] font-semibold text-[#47453f]'
const requiredMark = <span className="ml-0.5 text-[#b42318]">*</span>
const hintClass = 'text-[11px] font-medium text-[#7c7a75]'

export function NewLeadModal({ agentName }: { agentName: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [product, setProduct] = useState<LoanType>('PL')
  const [amount, setAmount] = useState('')
  const [savedToast, setSavedToast] = useState<string | null>(null)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await createLead(formData)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  useEffect(() => {
    if (state?.success) {
      setSavedToast(state.success)
      formRef.current?.reset()
      setProduct('PL')
      setAmount('')
      const t = setTimeout(() => setSavedToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [state])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-lead-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-[#dcdbd6] bg-[#f7f6f4] shadow-[0_12px_40px_-10px_rgba(28,25,20,0.16),0_4px_12px_-4px_rgba(28,25,20,0.08)] sm:max-w-[520px] sm:rounded-[28px]"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dde3fd] bg-[#eef1fe]">
              <User size={16} className="text-[#2440e8]" />
            </span>
            <div>
              <h1 id="new-lead-title" className="text-[15px] font-bold leading-tight text-[#1a1917]">New lead</h1>
              <p className="mt-0.5 text-[11px] text-[#7c7a75]">Capture the essentials now — the rest goes in from the file later.</p>
            </div>
          </div>
          <Link
            href="/partner/leads"
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7c7a75] hover:bg-[#e3e2de] hover:text-[#47453f]"
          >
            <X size={16} />
          </Link>
        </div>

        <form id="new-lead-form" ref={formRef} action={formAction} className="px-5 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={`${labelClass} mb-1.5 block`} htmlFor="client_name">Customer name{requiredMark}</label>
              <input id="client_name" name="client_name" required placeholder="Full name as on PAN" className={fieldInputClass} />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className={labelClass} htmlFor="phone">Mobile number{requiredMark}</label>
                <span className={hintClass}>10 digits</span>
              </div>
              <input
                id="phone"
                name="phone"
                required
                inputMode="numeric"
                placeholder="98765 43210"
                className={fieldInputClass}
                onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10) }}
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className={labelClass} htmlFor="email">Email</label>
                <span className={hintClass}>optional</span>
              </div>
              <input id="email" name="email" type="email" placeholder="name@example.com" className={fieldInputClass} />
            </div>

            <div className="col-span-2">
              <div className="mb-1.5 flex items-baseline justify-between">
                <label className={labelClass} htmlFor="residence_address">Address</label>
                <span className={hintClass}>optional</span>
              </div>
              <textarea id="residence_address" name="residence_address" rows={2} placeholder="Locality and city is enough for now" className={`${fieldInputClass} h-auto resize-y py-2.5`} />
            </div>

            <div className="col-span-2">
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

            <div className="col-span-2">
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
          {savedToast && <p className="mt-4 text-[12px] font-medium text-[#2440e8]">Saved {savedToast} — add the next lead.</p>}
        </form>

        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-[#dcdbd6]/70 bg-[#f7f6f4] px-5 py-3.5">
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58]">
            Assigned to {agentName}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              form="new-lead-form"
              name="submit_mode"
              value="add_another"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#efeeeb] px-4 text-[13px] font-semibold text-[#47453f] transition-colors hover:bg-[#e3e2de] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus size={16} /> Save &amp; add another
            </button>
            <button
              type="submit"
              form="new-lead-form"
              name="submit_mode"
              value="default"
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {pending ? 'Creating…' : <>Create &amp; open <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
