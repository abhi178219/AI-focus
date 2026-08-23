'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { addLenderProduct } from '@/app/actions/lenderProducts'
import type { Product } from '@/lib/types'

type State = { error?: string; saved?: boolean }

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] focus:border-[#16161a] focus:outline-none'

export function AddLenderProductForm({ products, canEdit }: { products: Product[]; canEdit: boolean }) {
  const router = useRouter()

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await addLenderProduct(formData)
    if (result?.error) return { error: result.error }
    router.refresh()
    return { saved: true }
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  if (!canEdit) {
    return (
      <p className="rounded-[20px] bg-[#efeeeb] p-4 text-[12px] text-[#7c7a75]">
        Only ops admins can add lender products. Ask your ops team to add a lender option, and it will appear here for everyone.
      </p>
    )
  }

  return (
    <form action={formAction} className="rounded-[20px] bg-[#efeeeb] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Product family">
          <select name="product_id" required className={inputClass} defaultValue="">
            <option value="" disabled>Select…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Product name"><input name="display_name" required placeholder="Personal Loan OD" className={inputClass} /></Field>
        <Field label="Lender"><input name="lender_name" required placeholder="HDFC Bank" className={inputClass} /></Field>
        <Field label="Short code"><input name="short_code" placeholder="PL OD" className={inputClass} /></Field>
        <Field label="Rate (% p.a.)"><input name="interest_rate" type="number" step="0.01" required placeholder="10.5" className={inputClass} /></Field>
        <Field label="Max sanction (₹)"><input name="max_sanction_amount" type="number" required placeholder="3000000" className={inputClass} /></Field>
        <Field label="Tenure (years)">
          <div className="flex items-center gap-2">
            <input name="min_tenure_years" type="number" step="0.5" required placeholder="Min" className={inputClass} />
            <span className="text-[#7c7a75]">–</span>
            <input name="max_tenure_years" type="number" step="0.5" required placeholder="Max" className={inputClass} />
          </div>
        </Field>
        <Field label="Processing fee (%)"><input name="processing_fee_percent" type="number" step="0.05" defaultValue={1} className={inputClass} /></Field>
        <Field label="Turnaround (days)"><input name="turnaround_days" type="number" min="1" placeholder="14" className={inputClass} /></Field>
        <Field label="Credit-box note"><input name="credit_box_note" placeholder="Prefers self-occupied residential security" className={inputClass} /></Field>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? 'Adding…' : 'Add product'}
        </button>
        {state?.saved && <span className="text-[12px] text-[#16694a]">Added.</span>}
        {state?.error && <span className="text-[12px] text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">{label}</label>
      {children}
    </div>
  )
}
