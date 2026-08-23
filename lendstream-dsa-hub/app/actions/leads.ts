'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { LeadStage, LoanType } from '@/lib/types'

function numOrNull(value: FormDataEntryValue | null) {
  const s = String(value ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// Deliberately minimal — only what's needed to open a file. Income, tenure,
// property, co-applicant, CIBIL, etc. get filled in afterwards on the
// Applicant tab, either by hand or applied from parsed documents (see
// applyExtractedFields in app/actions/pipeline.ts). Forcing all of that
// upfront doesn't match how a DSA actually captures a lead.
export async function createLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload = {
    agent_id: user.id,
    client_name: String(formData.get('client_name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim() || null,
    pan_number: String(formData.get('pan_number') ?? '').trim().toUpperCase() || null,
    loan_type: String(formData.get('loan_type') ?? 'PL') as LoanType,
    requested_amount: numOrNull(formData.get('requested_amount')) ?? 0,
  }

  if (!payload.client_name || !payload.phone || !(payload.requested_amount > 0)) {
    return { error: 'Client name, phone, and a requested amount greater than zero are required.' }
  }

  const { data, error } = await supabase.from('leads').insert(payload).select('id').single()
  if (error) return { error: error.message }

  revalidatePath('/partner/leads')
  redirect(`/partner/leads/${data.id}?tab=applicant`)
}

export async function updateLeadDetails(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const textOrNull = (k: string) => String(formData.get(k) ?? '').trim() || null

  // Property fields only appear on secured files; omitting them from the form
  // must not wipe an existing value, so only include keys the form submitted.
  const payload: Record<string, unknown> = {
    email: textOrNull('email'),
    pan_number: String(formData.get('pan_number') ?? '').trim().toUpperCase() || null,
    date_of_birth: textOrNull('date_of_birth'),
    gender: textOrNull('gender'),
    marital_status: textOrNull('marital_status'),
    residence_city: textOrNull('residence_city'),
    employment_type: textOrNull('employment_type'),
    monthly_income: numOrNull(formData.get('monthly_income')),
    existing_emis: numOrNull(formData.get('existing_emis')) ?? 0,
    tenure_years: numOrNull(formData.get('tenure_years')),
    cibil_score: numOrNull(formData.get('cibil_score')),
    business_name: textOrNull('business_name'),
    business_constitution: textOrNull('business_constitution'),
    business_vintage_years: numOrNull(formData.get('business_vintage_years')),
    industry: textOrNull('industry'),
    has_co_applicant: formData.get('has_co_applicant') === 'on',
    co_applicant_income: numOrNull(formData.get('co_applicant_income')),
    bank_assigned: textOrNull('bank_assigned'),
    updated_at: new Date().toISOString(),
  }
  if (formData.has('property_value')) {
    payload.property_value = numOrNull(formData.get('property_value'))
    payload.property_city = textOrNull('property_city')
    payload.property_stage = textOrNull('property_stage')
  }

  const { data: updated, error } = await supabase.from('leads').update(payload).eq('id', leadId).select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: "Could not save — you don't have access to this lead." }
  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}

export async function updateLeadStage(leadId: string, stage: LeadStage, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: updated, error } = await supabase.from('leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', leadId).select('id')
  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: "Could not update — you don't have access to this lead." }

  const trimmedNote = note?.trim()
  if (trimmedNote) {
    await supabase.from('interactions').insert({
      lead_id: leadId,
      agent_id: user.id,
      channel: 'STAGE_CHANGE',
      outcome: `Moved to ${stage}`,
      note: trimmedNote,
    })
  }

  revalidatePath(`/partner/leads/${leadId}`)
  revalidatePath('/partner/leads')
  return {}
}

export async function addInteraction(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('interactions').insert({
    lead_id: leadId,
    agent_id: user.id,
    channel: String(formData.get('channel') ?? 'CALL'),
    outcome: String(formData.get('outcome') ?? '').trim() || null,
    note: String(formData.get('note') ?? '').trim() || null,
    next_follow_up: String(formData.get('next_follow_up') ?? '').trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}
