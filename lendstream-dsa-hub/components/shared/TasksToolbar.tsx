'use client'

import { useRouter } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import type { TaskPeriod } from '@/lib/dates'

const PERIODS: { key: TaskPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

/** Period (day/week/month) and view (grid/list) toggles, URL-driven — same
 *  pattern as LeadsFilterBar, so the chosen view survives a refresh/share. */
export function TasksToolbar({ period, view }: { period: TaskPeriod; view: 'list' | 'grid' }) {
  const router = useRouter()

  function go(next: { period?: TaskPeriod; view?: 'list' | 'grid' }) {
    const params = new URLSearchParams()
    params.set('period', next.period ?? period)
    params.set('view', next.view ?? view)
    router.push(`/partner/tasks?${params.toString()}`)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div className="inline-flex rounded-full border border-[#dcdbd6] bg-[#f7f6f4] p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key} type="button" onClick={() => go({ period: p.key })}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
              period === p.key ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#efeeeb]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ml-auto inline-flex rounded-full border border-[#dcdbd6] bg-[#f7f6f4] p-1">
        <button
          type="button" onClick={() => go({ view: 'list' })} title="List view"
          className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${view === 'list' ? 'bg-[#1a1917] text-white' : 'text-[#7c7a75] hover:bg-[#efeeeb]'}`}
        >
          <List size={15} />
        </button>
        <button
          type="button" onClick={() => go({ view: 'grid' })} title="Grid view"
          className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${view === 'grid' ? 'bg-[#1a1917] text-white' : 'text-[#7c7a75] hover:bg-[#efeeeb]'}`}
        >
          <LayoutGrid size={15} />
        </button>
      </div>
    </div>
  )
}
