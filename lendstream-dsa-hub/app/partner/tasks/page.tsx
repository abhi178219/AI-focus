import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, ListChecks, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardBody } from '@/components/ui/Card'
import { TasksToolbar } from '@/components/shared/TasksToolbar'
import { TaskItem, type TaskWithRefs } from '@/components/shared/TaskItem'
import { periodRange, todayISO, PERIOD_LABEL, type TaskPeriod } from '@/lib/dates'
import { fmtAmount } from '@/lib/format'
import type { Task } from '@/lib/types'

function isPeriod(v: string | undefined): v is TaskPeriod {
  return v === 'day' || v === 'week' || v === 'month'
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null
  return (
    <div className="mb-4">
      <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-[#7c7a75]">{title} · {count}</p>
      {children}
    </div>
  )
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ period?: string; view?: string }> }) {
  const { period: rawPeriod, view: rawView } = await searchParams
  const period: TaskPeriod = isPeriod(rawPeriod) ? rawPeriod : 'week'
  const view: 'list' | 'grid' = rawView === 'grid' ? 'grid' : 'list'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase.from('tasks').select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .returns<Task[]>()
  const allTasks = tasks ?? []

  const applicantIds = [...new Set(allTasks.map((t) => t.applicant_id).filter((v): v is string => !!v))]
  const leadIds = [...new Set(allTasks.map((t) => t.lead_id).filter((v): v is string => !!v))]

  const [{ data: applicantRows }, { data: leadRows }, { data: allApplicants }, { data: allLeads }] = await Promise.all([
    applicantIds.length
      ? supabase.from('applicants').select('id, client_name').in('id', applicantIds)
      : Promise.resolve({ data: [] as { id: string; client_name: string }[] }),
    leadIds.length
      ? supabase.from('leads').select('id, loan_type, requested_amount').in('id', leadIds)
      : Promise.resolve({ data: [] as { id: string; loan_type: string; requested_amount: number }[] }),
    supabase.from('applicants').select('id').eq('agent_id', user.id).limit(1),
    supabase.from('leads').select('id').eq('agent_id', user.id).limit(1),
  ])
  const applicantNameById = new Map((applicantRows ?? []).map((a) => [a.id, a.client_name]))
  const leadLabelById = new Map((leadRows ?? []).map((l) => [l.id, `${l.loan_type} · ${fmtAmount(Number(l.requested_amount))}`]))
  const hasAnyApplicant = (allApplicants ?? []).length > 0
  const hasAnyLead = (allLeads ?? []).length > 0

  const withRefs: TaskWithRefs[] = allTasks.map((t) => ({
    ...t,
    applicantName: t.applicant_id ? applicantNameById.get(t.applicant_id) ?? null : null,
    leadLabel: t.lead_id ? leadLabelById.get(t.lead_id) ?? null : null,
  }))

  const today = todayISO()
  const overdue = withRefs.filter((t) => t.status === 'PENDING' && t.due_date && t.due_date < today)
  const highPriorityPending = withRefs.filter((t) => t.status === 'PENDING' && t.priority === 'HIGH')

  const { from, to } = periodRange(period)
  const inPeriod = withRefs.filter((t) => t.due_date && t.due_date >= from && t.due_date <= to)
  const periodPending = inPeriod.filter((t) => t.status === 'PENDING')
  const periodCompleted = inPeriod.filter((t) => t.status === 'COMPLETED')
  const noDueDate = withRefs.filter((t) => !t.due_date && t.status === 'PENDING')

  const listWrap = view === 'grid'
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'
    : 'divide-y divide-[#e7e6e2] rounded-2xl border border-[#dcdbd6] bg-[#f7f6f4]'

  function renderGroup(items: TaskWithRefs[]) {
    return (
      <div className={listWrap}>
        {items.map((t) => <TaskItem key={t.id} task={t} view={view} />)}
      </div>
    )
  }

  return (
    <div className="pt-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#16161a]">Tasks</h1>
          <p className="text-[13px] text-[#7c7a75]">Follow-ups and to-dos across your leads</p>
        </div>
        <Link
          href="/partner/tasks/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-[13px] font-semibold text-white hover:opacity-90"
        >
          <Plus size={14} strokeWidth={3} /> New task
        </Link>
      </div>

      {(overdue.length > 0 || highPriorityPending.length > 0) && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#f3d9d9] bg-[#fdf3f2] px-4 py-3 text-[12.5px] font-medium text-[#8a2f2f]">
          <AlertTriangle size={15} className="shrink-0" />
          <span>
            {overdue.length > 0 && `${overdue.length} overdue`}
            {overdue.length > 0 && highPriorityPending.length > 0 && ' · '}
            {highPriorityPending.length > 0 && `${highPriorityPending.length} high priority pending`}
          </span>
        </div>
      )}

      <TasksToolbar period={period} view={view} />

      {allTasks.length === 0 ? (
        <Card>
          <CardBody className="py-16">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#efeeeb] text-[#7c7a75]">
                <ListChecks size={22} />
              </span>
              <p className="text-[14px] font-semibold text-[#16161a]">Nothing here yet</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#7c7a75]">
                No tasks yet — add one and, if you like, tag it to an applicant{hasAnyLead ? ' or a specific application' : ''}.
              </p>
              {!hasAnyApplicant && !hasAnyLead && (
                <p className="mt-2 text-[11px] text-[#a8a6a0]">Add an applicant or a lead first if you want to tag a task to one.</p>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <>
          <Section title="Overdue" count={overdue.length}>{renderGroup(overdue)}</Section>
          <Section title={`${PERIOD_LABEL[period]} · Pending`} count={periodPending.length}>{renderGroup(periodPending)}</Section>
          <Section title={`${PERIOD_LABEL[period]} · Completed`} count={periodCompleted.length}>{renderGroup(periodCompleted)}</Section>
          <Section title="No due date" count={noDueDate.length}>{renderGroup(noDueDate)}</Section>

          {periodPending.length === 0 && periodCompleted.length === 0 && overdue.length === 0 && noDueDate.length === 0 && (
            <p className="px-1 text-[12.5px] text-[#7c7a75]">Nothing due {PERIOD_LABEL[period].toLowerCase()}.</p>
          )}
        </>
      )}
    </div>
  )
}
