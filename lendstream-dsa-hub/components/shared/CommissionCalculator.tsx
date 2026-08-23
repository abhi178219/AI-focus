'use client'

import { useMemo, useState } from 'react'

interface Slab {
  id: string
  bank_name: string
  product_category: string
  slab_min_amount: number
  slab_max_amount: number | null
  commission_percent: number
}

export function CommissionCalculator({ slabs }: { slabs: Slab[] }) {
  const [amount, setAmount] = useState(2500000)
  const [category, setCategory] = useState('PL')

  const matches = useMemo(
    () => slabs.filter((s) => s.product_category === category && amount >= s.slab_min_amount && (s.slab_max_amount == null || amount <= s.slab_max_amount)),
    [slabs, amount, category],
  )

  return (
    <div className="grid grid-cols-2 gap-6 rounded-[28px] bg-[#f7f6f4] p-6 elev">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#16161a]">Disbursed amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#16161a]">Product category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm">
            <option value="PL">Personal Loan</option>
            <option value="HL">Home Loan</option>
            <option value="LAP">Loan Against Property</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-sm text-[#7c7a75]">Estimated commission by bank</div>
        {matches.length === 0 && <p className="text-sm text-[#c9c7c1]">No commission slab matches this amount/category.</p>}
        {matches.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl bg-[#efeeeb] px-4 py-3">
            <span className="text-sm font-medium text-[#16161a]">{s.bank_name}</span>
            <span className="text-sm text-[#5f5d58]">{s.commission_percent}% · ₹{Math.round(amount * s.commission_percent / 100).toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
