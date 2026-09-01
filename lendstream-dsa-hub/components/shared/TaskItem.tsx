'use client'

import { useActionState, useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { toggleTaskStatus, updateTask, deleteTask } from '@/app/actions/tasks'
import { fmtDueDate, isOverdue } from '@/lib/dates'
import type { Task, TaskPriority } from '@/lib/types'

type State = { error?: string }

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  LOW: 'bg-[#efeeeb] text-[#5f5d58]',
  MEDIUM: 'bg-[#fdf1e0] text-[#a06a10]',
  HIGH: 'bg-[#fdecec] text-[#b3323f]',
}
const PRIORITY_LABEL: Record<TaskPriority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' }

export interface TaskWithRefs extends Task {
  applicantName: string | null
  leadLabel: string | null
}

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-2.5 py-1.5 text-[12.5px] text-[#1a1917] focus:border-[#16161a] focus:outline-none'

export function TaskItem({ task, view }: { task: TaskWithRefs; view: 'list' | 'grid' }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const overdue = isOverdue(task.due_date, task.status)
  const done = task.status === 'COMPLETED'

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateTask(task.id, formData)
    if (!result?.error) setEditing(false)
    return result ?? {}
  }
  const [state, formAction, savePending] = useActionState<State, FormData>(action, {})

  function toggle() {
    startTransition(() => { toggleTaskStatus(task.id, done ? 'PENDING' : 'COMPLETED') })
  }
  function remove() {
    if (!window.confirm('Delete this task? This can’t be undone.')) return
    startTransition(() => { deleteTask(task.id) })
  }

  const linkChip = task.leadLabel
    ? `${task.applicantName ?? 'Application'} · ${task.leadLabel}`
    : task.applicantName

  if (editing) {
    return (
      <form
        action={formAction}
        className={view === 'grid'
          ? 'flex flex-col gap-2 rounded-2xl border border-[#dcdbd6] bg-white p-4'
          : 'flex flex-wrap items-center gap-2 rounded-xl border border-[#dcdbd6] bg-white px-4 py-3'}
      >
        <input name="title" defaultValue={task.title} autoFocus className={`${inputClass} ${view === 'grid' ? '' : 'flex-1 min-w-[160px]'}`} />
        <input name="due_date" type="date" defaultValue={task.due_date ?? ''} className={`${inputClass} ${view === 'grid' ? '' : 'w-[150px]'}`} />
        <select name="priority" defaultValue={task.priority} className={`${inputClass} ${view === 'grid' ? '' : 'w-[110px]'}`}>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
        <textarea name="notes" defaultValue={task.notes ?? ''} rows={view === 'grid' ? 2 : 1} placeholder="Notes" className={`${inputClass} ${view === 'grid' ? '' : 'w-full'}`} />
        {state?.error && <p className="w-full text-[11px] text-[#b42318]">{state.error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={savePending} className="rounded-full bg-[#1a1917] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {savePending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={savePending} className="rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]">
            Cancel
          </button>
        </div>
      </form>
    )
  }

  const checkbox = (
    <button
      type="button" onClick={toggle} disabled={pending} title={done ? 'Mark pending' : 'Mark completed'}
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
        done ? 'border-[#1a7f5a] bg-[#1a7f5a] text-white' : 'border-[#c9c7c1] bg-white text-transparent hover:border-[#16161a]'
      }`}
    >
      <Check size={12} strokeWidth={3} />
    </button>
  )

  const actions = (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" onClick={() => setEditing(true)} title="Edit" className="rounded-full p-1.5 text-[#a8a6a0] hover:bg-[#e3e2de] hover:text-[#47453f]">
        <Pencil size={13} />
      </button>
      <button type="button" onClick={remove} disabled={pending} title="Delete" className="rounded-full p-1.5 text-[#a8a6a0] hover:bg-[#fdecec] hover:text-[#b3323f]">
        <Trash2 size={13} />
      </button>
    </div>
  )

  const dueBadge = (
    <span className={`text-[11px] font-medium ${overdue ? 'text-[#b3323f]' : 'text-[#7c7a75]'}`}>
      {overdue ? `Overdue · ${fmtDueDate(task.due_date)}` : fmtDueDate(task.due_date)}
    </span>
  )
  const priorityBadge = (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${PRIORITY_STYLE[task.priority]}`}>
      {PRIORITY_LABEL[task.priority]}
    </span>
  )

  if (view === 'grid') {
    return (
      <div className={`flex flex-col gap-2.5 rounded-2xl border border-[#dcdbd6] bg-white p-4 ${done ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            {checkbox}
            <p className={`text-[13px] font-semibold leading-snug text-[#16161a] ${done ? 'line-through' : ''}`}>{task.title}</p>
          </div>
          {priorityBadge}
        </div>
        {task.notes && <p className="text-[11.5px] leading-snug text-[#7c7a75]">{task.notes}</p>}
        {linkChip && (
          <Link href={task.applicant_id ? `/partner/applicants/${task.applicant_id}` : '#'} className="inline-block w-fit truncate rounded-full bg-[#eef1fe] px-2.5 py-1 text-[10.5px] font-semibold text-[#2440e8] hover:underline">
            {linkChip}
          </Link>
        )}
        <div className="mt-auto flex items-center justify-between pt-1">
          {dueBadge}
          {actions}
        </div>
      </div>
    )
  }

  return (
    <div className={`group flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-[#efeeeb] ${done ? 'opacity-60' : ''}`}>
      {checkbox}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-semibold text-[#16161a] ${done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {dueBadge}
          {linkChip && (
            <>
              <span className="text-[#c9c7c1]">·</span>
              <Link href={task.applicant_id ? `/partner/applicants/${task.applicant_id}` : '#'} className="truncate text-[11px] font-medium text-[#2440e8] hover:underline">
                {linkChip}
              </Link>
            </>
          )}
        </div>
      </div>
      {priorityBadge}
      <div className="opacity-0 group-hover:opacity-100">{actions}</div>
    </div>
  )
}
