'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Marks an existing Applicant as a company (client_name becomes the company
 * name). Chosen deliberately over deciding this at "New lead" creation time
 * — keeps that modal exactly matched to the prototype. Reversible only by
 * direct DB edit for now; there's no "unmark" UI since a company that has
 * already gained key personnel shouldn't quietly lose that context.
 */
export async function markApplicantAsCompany(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const applicantId = String(formData.get('applicant_id') ?? '').trim()
  if (!applicantId) return

  const { data, error } = await supabase
    .from('applicants').update({ entity_type: 'COMPANY', updated_at: new Date().toISOString() })
    .eq('id', applicantId).select('id')
  if (error) return
  if (!data || data.length === 0) return // RLS filtered — not this agent's applicant.

  revalidatePath(`/partner/applicants/${applicantId}`)
}

type State = { error?: string }

/**
 * Adds a key person to a company Applicant — HubSpot Company→Contact style.
 * The key person is created as a full, independent individual Applicant
 * (their own name/phone/PAN/email), then linked via `key_personnel`, so
 * their own applications, list-page row, and detail page all work through
 * the exact same machinery every other Applicant already uses — no separate
 * "key person application" concept exists or is needed.
 */
export async function addKeyPersonnel(companyApplicantId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company, error: companyError } = await supabase
    .from('applicants').select('id, agent_id, entity_type').eq('id', companyApplicantId).single()
  if (companyError || !company) return { error: "Could not find that company — you may not have access to it." }
  if (company.agent_id !== user.id) return { error: "You don't have access to add key personnel to this company." }

  const client_name = String(formData.get('client_name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim() || null
  const pan_number = String(formData.get('pan_number') ?? '').trim().toUpperCase() || null
  const designation = String(formData.get('designation') ?? '').trim() || null

  if (!client_name || !/^\d{10}$/.test(phone)) {
    return { error: 'Enter a name and a valid 10-digit mobile number.' }
  }

  const { data: person, error: personError } = await supabase.from('applicants').insert({
    agent_id: user.id,
    client_name,
    phone,
    email,
    pan_number,
    entity_type: 'INDIVIDUAL',
  }).select('id').single()
  if (personError) return { error: personError.message }

  const { data: link, error: linkError } = await supabase.from('key_personnel').insert({
    company_applicant_id: companyApplicantId,
    linked_applicant_id: person.id,
    designation,
  }).select('id')
  if (linkError || !link || link.length === 0) {
    // Leave no orphan individual Applicant behind if the association failed
    // to write (RLS filters rather than erroring, so check the row count).
    const { data: deleted } = await supabase.from('applicants').delete().eq('id', person.id).select('id')
    if (!deleted || deleted.length === 0) {
      console.error(`[addKeyPersonnel] failed to roll back orphan applicant ${person.id} after key_personnel insert error`)
    }
    return { error: linkError?.message ?? 'Could not add — you may not have access to this company.' }
  }

  revalidatePath(`/partner/applicants/${companyApplicantId}`)
  redirect(`/partner/applicants/${companyApplicantId}`)
}

/**
 * Edits a key person's role at the company. Their name/phone/PAN/email live
 * on their own linked Applicant record and are edited there (via
 * updateApplicant) — this only ever touches the association row itself.
 */
export async function updateKeyPersonnelDesignation(keyPersonnelId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kp, error: kpError } = await supabase
    .from('key_personnel').select('id, company_applicant_id').eq('id', keyPersonnelId).single()
  if (kpError || !kp) return { error: "Could not find that key personnel record." }

  const { data: company } = await supabase.from('applicants').select('agent_id').eq('id', kp.company_applicant_id).single()
  if (!company || company.agent_id !== user.id) return { error: "You don't have access to edit this." }

  const designation = String(formData.get('designation') ?? '').trim() || null
  const { data, error } = await supabase.from('key_personnel').update({ designation }).eq('id', keyPersonnelId).select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this company." }

  revalidatePath(`/partner/applicants/${kp.company_applicant_id}`)
  return {}
}
