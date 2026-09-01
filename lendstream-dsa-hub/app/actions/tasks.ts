'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskPriority, TaskStatus } from '@/lib/types'

type State = { error?: string }

function parsePriority(v: FormDataEntryValue | null): TaskPriority {
  const s = String(v ?? 'MEDIUM').toUpperCase()
  return s === 'LOW' || s === 'HIGH' ? s : 'MEDIUM'
}

/**
 * Creates a task, optionally tagged to an Applicant and/or a specific
 * Application (lead) — either, both, or neither may be set. `returnTo` is
 * wherever the "New task" modal was opened from (the Tasks page, or an
 * Applicant/Application page), matching the addKeyPersonnel/closeHref
 * pattern already used for page-based modals.
 */
export async function createTask(returnTo: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Enter a task title.' }

  const notes = String(formData.get('notes') ?? '').trim() || null
  const due_date = String(formData.get('due_date') ?? '').trim() || null
  const priority = parsePriority(formData.get('priority'))
  let applicant_id = String(formData.get('applicant_id') ?? '').trim() || null
  const lead_id = String(formData.get('lead_id') ?? '').trim() || null

  // An application was picked but not an applicant — derive it so the task
  // still surfaces under that person, without requiring the user to pick both.
  if (lead_id && !applicant_id) {
    const { data: lead } = await supabase.from('leads').select('applicant_id').eq('id', lead_id).maybeSingle()
    applicant_id = lead?.applicant_id ?? null
  }

  const { error } = await supabase.from('tasks').insert({
    agent_id: user.id, title, notes, due_date, priority, applicant_id, lead_id,
  })
  if (error) return { error: error.message }

  revalidatePath('/partner/tasks')
  if (applicant_id) revalidatePath(`/partner/applicants/${applicant_id}`)
  redirect(returnTo)
}

/** Toggles a task between pending and completed, stamping/clearing completed_at. */
export async function toggleTaskStatus(taskId: string, nextStatus: TaskStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.from('tasks')
    .update({ status: nextStatus, completed_at: nextStatus === 'COMPLETED' ? new Date().toISOString() : null })
    .eq('id', taskId).select('id')
  if (error || !data || data.length === 0) return // RLS filtered — not this agent's task.

  revalidatePath('/partner/tasks')
}

/** Edits a task's title, notes, due date and priority. */
export async function updateTask(taskId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  if (!title) return { error: 'Enter a task title.' }

  const notes = String(formData.get('notes') ?? '').trim() || null
  const due_date = String(formData.get('due_date') ?? '').trim() || null
  const priority = parsePriority(formData.get('priority'))

  const { data, error } = await supabase.from('tasks')
    .update({ title, notes, due_date, priority, updated_at: new Date().toISOString() })
    .eq('id', taskId).select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this task." }

  revalidatePath('/partner/tasks')
  return {}
}

/** Deletes a task outright — tasks are disposable to-dos, unlike core records. */
export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase.from('tasks').delete().eq('id', taskId).select('id')
  if (error || !data || data.length === 0) return

  revalidatePath('/partner/tasks')
}
