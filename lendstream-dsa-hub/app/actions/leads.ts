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
//
// Creates a fresh Applicant (the person) and one Application (a `leads` row)
// under it together, every time — "New lead" never auto-matches an existing
// Applicant by phone number, so two people can't get silently merged and a
// mistyped digit can't silently misfile someone. A second Application for a
// returning customer is only ever added explicitly, from that Applicant's own
// record — see createApplication below. See
// /decisions/2026-08-31-lendstream-dsa-hub-applicant-application-relation.md.
export async function createLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const applicantPayload = {
    agent_id: user.id,
    client_name: String(formData.get('client_name') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim() || null,
    residence_address: String(formData.get('residence_address') ?? '').trim() || null,
  }
  const loan_type = String(formData.get('loan_type') ?? 'PL') as LoanType
  const requested_amount = numOrNull(formData.get('requested_amount')) ?? 0

  if (!applicantPayload.client_name || !/^\d{10}$/.test(applicantPayload.phone) || !(requested_amount > 0)) {
    return { error: 'Enter a customer name, a valid 10-digit mobile number, and an amount greater than zero.' }
  }

  const { data: applicant, error: applicantError } = await supabase
    .from('applicants').insert(applicantPayload).select('id').single()
  if (applicantError) return { error: applicantError.message }

  const { data, error } = await supabase.from('leads').insert({
    agent_id: user.id,
    applicant_id: applicant.id,
    client_name: applicantPayload.client_name,
    phone: applicantPayload.phone,
    email: applicantPayload.email,
    residence_address: applicantPayload.residence_address,
    loan_type,
    requested_amount,
  }).select('id').single()
  if (error) {
    // Leave no orphan Applicant behind if the Application couldn't be
    // created. RLS filters rather than erroring, so check the row count —
    // an unnoticed 0-row delete here would silently leave a phantom
    // Applicant with zero Applications on every such failure.
    const { data: deleted } = await supabase.from('applicants').delete().eq('id', applicant.id).select('id')
    if (!deleted || deleted.length === 0) {
      console.error(`[createLead] failed to roll back orphan applicant ${applicant.id} after Application insert error:`, error.message)
    }
    return { error: error.message }
  }

  revalidatePath('/partner/leads')
  revalidatePath('/partner')
  if (formData.get('submit_mode') === 'add_another') return { success: applicantPayload.client_name }
  redirect(`/partner/leads/${data.id}?tab=applicant`)
}

// Adds a second (or further) Application under an Applicant who already
// exists — reached only from that Applicant's own record, never inferred.
// Only Product + Amount are asked for; identity fields are read from the
// Applicant record itself, not re-entered.
//
// The new lead's agent_id is always the Applicant's OWN agent_id, never the
// caller's — an ops_admin can see every partner's Applicant on this
// dashboard, but must never be able to graft a lead onto a partner's book.
// leads_insert_own only allows agent_id = auth.uid(), so an ops caller (or
// anyone acting on an Applicant they don't own) correctly gets an RLS error
// here rather than silently authoring a lead the actual owner can't see.
export async function createApplication(applicantId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: applicant, error: applicantError } = await supabase
    .from('applicants').select('id, agent_id, client_name, phone, email, residence_address')
    .eq('id', applicantId).single()
  if (applicantError || !applicant) return { error: "Could not find that applicant — you may not have access to it." }

  const loan_type = String(formData.get('loan_type') ?? 'PL') as LoanType
  const requested_amount = numOrNull(formData.get('requested_amount')) ?? 0
  if (!(requested_amount > 0)) return { error: 'Enter an amount greater than zero.' }

  const { data, error } = await supabase.from('leads').insert({
    agent_id: applicant.agent_id,
    applicant_id: applicant.id,
    client_name: applicant.client_name,
    phone: applicant.phone,
    email: applicant.email,
    residence_address: applicant.residence_address,
    loan_type,
    requested_amount,
  }).select('id').single()
  if (error) return { error: error.message }

  revalidatePath('/partner/leads')
  revalidatePath('/partner')
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

const INTERACTION_CATEGORIES = new Set(['CUSTOMER', 'INTERNAL', 'BANK'])

/**
 * Logs one interaction under whichever of the three Activity sub-tabs the
 * form was on. `category` picks the tab; `party` means the internal team
 * (Sales/BM/Ops/Management) for INTERNAL, the bank/lender name for BANK, and
 * is unused for CUSTOMER — the UI only ever sends the field that applies.
 */
export async function addInteraction(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const categoryRaw = String(formData.get('category') ?? 'CUSTOMER')
  const category = INTERACTION_CATEGORIES.has(categoryRaw) ? categoryRaw : 'CUSTOMER'

  const { error } = await supabase.from('interactions').insert({
    lead_id: leadId,
    agent_id: user.id,
    category,
    party: String(formData.get('party') ?? '').trim() || null,
    channel: String(formData.get('channel') ?? 'CALL'),
    outcome: String(formData.get('outcome') ?? '').trim() || null,
    note: String(formData.get('note') ?? '').trim() || null,
    next_follow_up: String(formData.get('next_follow_up') ?? '').trim() || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}

/**
 * Section-scoped update for the Applicant tab.
 *
 * Only writes keys the submitted card actually contained, so editing one card
 * can never blank a field that lives on another. Checkboxes are handled by an
 * explicit `__bool:<name>` marker, because an unchecked box submits nothing.
 */
const TEXT_FIELDS = new Set([
  'email', 'pan_number', 'gender', 'marital_status', 'residence_city', 'employment_type',
  'business_name', 'business_constitution', 'industry', 'bank_assigned', 'property_city',
  'property_stage', 'father_name', 'qualification', 'aadhaar_last4', 'residence_address',
  'permanent_address', 'residence_type', 'company_pan', 'gstin', 'udyam_number', 'cin',
  'designation', 'din', 'office_address', 'business_premises_ownership',
  'co_applicant_name', 'co_applicant_relationship',
])
const DATE_FIELDS = new Set(['date_of_birth', 'incorporation_date', 'co_applicant_dob'])
const NUMBER_FIELDS = new Set([
  'monthly_income', 'existing_emis', 'tenure_years', 'cibil_score', 'property_value',
  'co_applicant_income', 'business_vintage_years', 'years_at_residence',
  'business_years_at_premises', 'business_employee_count',
  'business_credit_sales_percent', 'business_customer_concentration_percent',
])
const BOOL_FIELDS = new Set(['has_co_applicant', 'permanent_same_as_current'])

export async function updateLeadSection(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload: Record<string, unknown> = {}

  for (const key of new Set(formData.keys())) {
    if (TEXT_FIELDS.has(key)) {
      const v = String(formData.get(key) ?? '').trim()
      payload[key] = v ? (key === 'pan_number' || key === 'company_pan' || key === 'co_applicant_pan' ? v.toUpperCase() : v) : null
    } else if (DATE_FIELDS.has(key)) {
      payload[key] = String(formData.get(key) ?? '').trim() || null
    } else if (NUMBER_FIELDS.has(key)) {
      payload[key] = numOrNull(formData.get(key))
    } else if (BOOL_FIELDS.has(key)) {
      payload[key] = formData.get(key) === 'on'
    }
  }
  // A checkbox that was rendered but left unchecked submits no key at all, so
  // any bool field belonging to this card is set explicitly from the marker.
  for (const marker of formData.getAll('__bool')) {
    const name = String(marker)
    if (BOOL_FIELDS.has(name) && !(name in payload)) payload[name] = false
  }

  if (Object.keys(payload).length === 0) return { error: 'Nothing to save.' }

  // If the user is hand-editing a field a document previously supplied, that is
  // the strongest signal the extractor got it wrong. Capture it before the write
  // so the old value is still available to log against.
  const { data: before } = await supabase
    .from('leads').select('*').eq('id', leadId).single()
  const fromDocs: string[] = (before?.fields_from_documents ?? []) as string[]
  const corrected = Object.keys(payload).filter(
    (k) => fromDocs.includes(k) && String(before?.[k] ?? '') !== String(payload[k] ?? ''),
  )

  payload.updated_at = new Date().toISOString()

  // RLS filters rows rather than erroring, so check the affected row count.
  const { data, error } = await supabase.from('leads').update(payload).eq('id', leadId).select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this lead." }

  if (corrected.length) {
    try {
      const { data: srcDocs } = await supabase
        .from('documents').select('id, type, extraction_model')
        .eq('lead_id', leadId).eq('status', 'verified')
        .order('uploaded_at', { ascending: false }).limit(1)
      const src = srcDocs?.[0]
      if (src) {
        await supabase.from('extraction_corrections').insert(corrected.map((field) => ({
          document_id: src.id,
          document_type: src.type,
          field,
          extracted_value: String(before?.[field] ?? '') || null,
          corrected_value: String(payload[field] ?? '') || null,
          kind: 'overwrite',
          model: src.extraction_model,
          corrected_by: user.id,
        })))
      }
    } catch {
      // Non-fatal — the learning log must never block a save.
    }
  }

  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}
