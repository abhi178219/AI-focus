import { PERIOD_LABEL, type TaskPeriod } from '@/lib/dates'

/**
 * Task volume at a glance — total pending regardless of due date, plus
 * created-vs-pending for all three periods at once, independent of whichever
 * period tab is selected below. "Created" counts by `created_at`; "pending"
 * counts open tasks whose `due_date` falls in that window.
 */
export function TaskSummaryStrip({
  totalPending, periods,
}: {
  totalPending: number
  periods: { period: TaskPeriod; created: number; pending: number }[]
}) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      <div className="rounded-[20px] border border-[#dcdbd6] bg-[#efeeeb] px-4 py-3 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Pending</p>
        <p className="text-[18px] font-bold text-[#16161a] tnum leading-tight mt-0.5">{totalPending}</p>
        <p className="text-[10.5px] text-[#7c7a75] mt-0.5">All open tasks</p>
      </div>
      {periods.map(({ period, created, pending }) => (
        <div key={period} className="rounded-[20px] border border-[#dcdbd6] bg-[#f7f6f4] px-4 py-3 min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{PERIOD_LABEL[period]}</p>
          <p className="text-[18px] font-bold text-[#16161a] tnum leading-tight mt-0.5">{created}</p>
          <p className="text-[10.5px] text-[#7c7a75] mt-0.5">created · {pending} pending due</p>
        </div>
      ))}
    </div>
  )
}
