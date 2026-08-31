'use client'

import { useRouter } from 'next/navigation'
import { Columns3 } from 'lucide-react'
import { STAGE_LABELS, LEAD_STAGES } from '@/lib/types'

const PRODUCT_OPTIONS = [
  { value: '', label: 'All products' },
  { value: 'PL', label: 'Personal Loan' },
  { value: 'BL', label: 'Business Loan' },
  { value: 'WC', label: 'Working Capital' },
  { value: 'HL', label: 'Home Loan' },
  { value: 'LAP', label: 'Loan Against Property' },
  { value: 'BOTH', label: 'PL + HL' },
]

/**
 * Filter row from the prototype: two real dropdowns (not chips), the result
 * summary, a column picker and the primary action — all on one line.
 */
export function LeadsFilterBar({
  basePath, segment, product, stage, q, summary, columnsOpen,
}: {
  basePath: string
  segment: string
  product: string
  stage: string
  q: string
  summary: string
  columnsOpen?: React.ReactNode
}) {
  const router = useRouter()

  function go(next: { product?: string; stage?: string }) {
    const params = new URLSearchParams()
    if (segment && segment !== 'all') params.set('segment', segment)
    const p = next.product ?? product
    const s = next.stage ?? stage
    if (p) params.set('product', p)
    if (s) params.set('stage', s)
    if (q) params.set('q', q)
    const qs = params.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  const selectClass = 'rounded-full border border-[#dcdbd6] bg-[#f7f6f4] px-4 py-2 text-[12.5px] text-[#47453f] focus:border-[#16161a] focus:outline-none'

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <select value={product} onChange={(e) => go({ product: e.target.value })} className={selectClass}>
        {PRODUCT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select value={stage} onChange={(e) => go({ stage: e.target.value })} className={selectClass}>
        <option value="">All statuses</option>
        {LEAD_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
      </select>

      <span className="ml-auto text-[12px] text-[#7c7a75] tnum">{summary}</span>

      {columnsOpen ?? (
        <button type="button" className="inline-flex items-center gap-1.5 rounded-full border border-[#dcdbd6] bg-[#f7f6f4] px-3.5 py-2 text-[12.5px] font-medium text-[#5f5d58] hover:bg-[#efeeeb]" title="Columns">
          <Columns3 size={14} /> Columns
        </button>
      )}
    </div>
  )
}
