'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type State = { error?: string }

/**
 * Sets the Team Manager / Business Head an RM's file escalates to. These are
 * plain name/phone facts about the RM's own reporting line, not accounts —
 * this app has only dsa_partner/ops_admin, no distinct manager role — so
 * there is nothing to look up, only text to record.
 *
 * `profileId` is always the RM who OWNS the file the card was opened from —
 * one RM, one reporting line, shown wherever any of their files is open. RLS
 * (`profiles_update_self`/`profiles_update_ops`) already restricts the write
 * to the RM themselves or ops; this repeats that check server-side so the UI
 * can show a sentence instead of a silently-ignored zero-row update. Also see
 * the column-level GRANT in 032_profile_reporting_hierarchy.sql — RLS alone
 * does not permit updating these columns on this table.
 *
 * `applicantPath` is just which page to revalidate — the RM's reporting line
 * is one fact shared across every applicant they own, not applicant-scoped
 * data, so only the page the edit was made from needs a fresh render.
 */
export async function updateReportingHierarchy(profileId: string, applicantPath: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isOps = viewerProfile?.role === 'ops_admin'
  if (user.id !== profileId && !isOps) {
    return { error: "You don't have access to change this RM's reporting details." }
  }

  const team_manager_name = String(formData.get('team_manager_name') ?? '').trim() || null
  const team_manager_phone = String(formData.get('team_manager_phone') ?? '').trim() || null
  const business_head_name = String(formData.get('business_head_name') ?? '').trim() || null
  const business_head_phone = String(formData.get('business_head_phone') ?? '').trim() || null

  const { data, error } = await supabase
    .from('profiles')
    .update({ team_manager_name, team_manager_phone, business_head_name, business_head_phone })
    .eq('id', profileId)
    .select('id')
  if (error) return { error: error.message }
  // RLS/grant filters silently — a denied update returns zero rows, no error.
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this RM's profile." }

  revalidatePath(applicantPath)
  return {}
}
