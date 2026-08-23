'use client'

import { useState } from 'react'
import { FoirCalculator } from '@/components/shared/FoirCalculator'
import { UnsecuredBlCalculator } from '@/components/shared/UnsecuredBlCalculator'
import type { Product } from '@/lib/types'

interface Slab {
  id: string
  bank_name: string
  product_category: string
  slab_min_amount: number
  slab_max_amount: number | null
  commission_percent: number
}

/**
 * Top-level calculator switcher. Secured/salaried products run through the
 * FOIR model; unsecured business loans use their own four-basis workbook
 * model, which shares nothing with FOIR — hence the separate surface.
 */
const MODES = [
  { key: 'PL', label: 'PL' },
  { key: 'HL', label: 'HL' },
  { key: 'LAP', label: 'LAP' },
  { key: 'COMBO', label: 'Combo' },
  { key: 'UBL', label: 'Unsecured BL' },
] as const

type Mode = (typeof MODES)[number]['key']

export function CalculatorWorkspace({ products, slabs }: { products: Product[]; slabs: Slab[] }) {
  const [mode, setMode] = useState<Mode>('PL')

  return (
    <div className="space-y-4">
      <div className="flex w-fit flex-wrap gap-1 rounded-full bg-[#f7f6f4] p-1 elev">
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold ${mode === m.key ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#efeeeb]'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'UBL' ? (
        <UnsecuredBlCalculator />
      ) : (
        <FoirCalculator
          products={products}
          slabs={slabs}
          category={mode === 'COMBO' ? null : mode}
          combo={mode === 'COMBO'}
        />
      )}
    </div>
  )
}
