import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CalculatorWorkspace } from '@/components/shared/CalculatorWorkspace'
import type { Product } from '@/lib/types'

export default async function CalculatorsPage() {
  const supabase = await createClient()
  const [{ data: products }, { data: slabs }] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).returns<Product[]>(),
    supabase.from('commission_slabs').select('*'),
  ])

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#16161a]">Calculators</h1>
          <p className="text-[13px] text-[#7c7a75]">Eligibility, FOIR and indicative sanction</p>
        </div>
        <Link href="/partner/leads/new" className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-white/20"><Plus size={11} strokeWidth={3} /></span>
          New lead
        </Link>
      </div>

      <CalculatorWorkspace products={products ?? []} slabs={slabs ?? []} />
    </div>
  )
}
