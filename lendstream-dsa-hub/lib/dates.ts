/**
 * Minimal date-range helpers for grouping Tasks by day/week/month. Everything
 * works in local time on plain 'YYYY-MM-DD' strings — matches how due dates
 * are entered and displayed everywhere else in this app; no timezone
 * conversion, no external date library.
 */

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** Monday of the week containing `d`. */
export function startOfWeekISO(d = new Date()): string {
  const dow = d.getDay() // 0=Sun..6=Sat
  const diff = (dow + 6) % 7 // days since Monday
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diff)
  return toISODate(monday)
}

/** Sunday of the week containing `d`. */
export function endOfWeekISO(d = new Date()): string {
  const dow = d.getDay()
  const diff = 6 - ((dow + 6) % 7)
  const sunday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
  return toISODate(sunday)
}

export function startOfMonthISO(d = new Date()): string {
  return toISODate(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function endOfMonthISO(d = new Date()): string {
  return toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export type TaskPeriod = 'day' | 'week' | 'month'

export const PERIOD_LABEL: Record<TaskPeriod, string> = { day: 'Today', week: 'This week', month: 'This month' }

export function periodRange(period: TaskPeriod): { from: string; to: string } {
  const now = new Date()
  if (period === 'day') return { from: todayISO(), to: todayISO() }
  if (period === 'week') return { from: startOfWeekISO(now), to: endOfWeekISO(now) }
  return { from: startOfMonthISO(now), to: endOfMonthISO(now) }
}

/** 'Mon, 3 Sep' style — compact, unambiguous, no year (matches the rest of
 *  the app's short date formatting). */
export function fmtDueDate(iso: string | null): string {
  if (!iso) return 'No due date'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function isOverdue(dueDate: string | null, status: string): boolean {
  return status === 'PENDING' && !!dueDate && dueDate < todayISO()
}
