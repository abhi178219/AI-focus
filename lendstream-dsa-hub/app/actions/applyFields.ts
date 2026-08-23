'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow, DocumentType, Lead } from '@/lib/types'
import { FIELD_LABELS } from '@/lib/fieldLabels'

type Extracted = Record<string, unknown>

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
const upper = (v: unknown) => text(v)?.toUpperCase() ?? null

/** Last four digits only — the full Aadhaar number is never stored. */
function aadhaarLast4(v: unknown): string | null {
  const s = text(v)
  if (!s) return null
  const digits = s.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : null
}

/**
 * Fields a given document type can legitimately speak to.
 *
 * Never touches client_name / phone / loan_type / requested_amount — those are
 * the user's own capture. A bank statement deliberately does NOT map to
 * monthly_income: average balance is not income. The rules engine already uses
 * it as a scoring proxy, but writing it onto the lead would present a proxy as
 * verified income.
 */
function mapExtractedToLeadPatch(type: DocumentType, data: Extracted): Partial<Lead> {
  switch (type) {
    case 'SALARY_SLIP': {
      const income = num(data.gross_salary) ?? num(data.net_salary)
      return income ? { monthly_income: income } : {}
    }
    case 'ITR': {
      const annual = num(data.gross_total_income)
      return annual ? { monthly_income: Math.round(annual / 12) } : {}
    }
    case 'PAN_CARD':
      return {
        ...(upper(data.pan_number) ? { pan_number: upper(data.pan_number)! } : {}),
        ...(text(data.dob) ? { date_of_birth: text(data.dob)! } : {}),
      }
    case 'AADHAAR':
      return {
        ...(aadhaarLast4(data.aadhaar_last4) ? { aadhaar_last4: aadhaarLast4(data.aadhaar_last4)! } : {}),
        ...(text(data.dob) ? { date_of_birth: text(data.dob)! } : {}),
        ...(text(data.address) ? { residence_address: text(data.address)! } : {}),
      }
    case 'CREDIT_REPORT':
      return {
        ...(num(data.score) ? { cibil_score: num(data.score)! } : {}),
        ...(num(data.total_monthly_obligations) ? { existing_emis: num(data.total_monthly_obligations)! } : {}),
      }
    case 'GST_RETURNS':
      return {
        ...(upper(data.gstin) ? { gstin: upper(data.gstin)! } : {}),
        ...(text(data.legal_name) ? { business_name: text(data.legal_name)! } : {}),
        ...(text(data.business_type) ? { industry: text(data.business_type)! } : {}),
      }
    case 'PROPERTY_DEED':
    case 'BUILDER_AGREEMENT':
    case 'OCCUPANCY_CERTIFICATE': {
      const value = num(data.registered_value)
      return value ? { property_value: value } : {}
    }
    case 'PROPERTY_VALUATION': {
      const value = num(data.valuation_amount)
      return value ? { property_value: value } : {}
    }
    default:
      return {}
  }
}

interface FieldProposal {
  field: string
  label: string
  /** What the lead holds today, as a display string. */
  current: string | null
  /** What this document says, as a display string. */
  extracted: string
  /** True when the lead already holds a different value — applying overwrites. */
  conflict: boolean
}

function display(v: unknown): string {
  if (v === null || v === undefined || v === '') return ''
  if (typeof v === 'number') return v.toLocaleString('en-IN')
  return String(v)
}

/**
 * What this document would change, without changing anything. Drives the
 * confirmation list so the user chooses field by field — including whether to
 * overwrite a value they entered by hand.
 */
export async function previewExtractedFields(documentId: string) {
  const supabase = await createClient()

  const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).single<DocumentRow>()
  if (!doc) return { error: 'Document not found.' }
  if (doc.status !== 'verified' || !doc.extracted_json) return { error: 'Document has not been parsed yet.' }

  const { data: lead } = await supabase.from('leads').select('*').eq('id', doc.lead_id).single<Lead>()
  if (!lead) return { error: 'Lead not found.' }

  const proposed = mapExtractedToLeadPatch(doc.type, doc.extracted_json as Extracted)
  const proposals: FieldProposal[] = []

  for (const [field, value] of Object.entries(proposed)) {
    if (value === null || value === undefined) continue
    const currentRaw = lead[field as keyof Lead]
    const current = display(currentRaw)
    const extracted = display(value)
    if (current === extracted) continue // nothing to change
    proposals.push({
      field,
      label: FIELD_LABELS[field] ?? field,
      current: current || null,
      extracted,
      conflict: current !== '',
    })
  }

  return { ok: true as const, proposals }
}

/**
 * Applies the chosen fields. Passing an explicit list is what allows an
 * overwrite: with no list we fall back to filling only empty fields, which is
 * the safe default for an unattended call.
 */
export async function applyExtractedFields(documentId: string, selectedFields?: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const { data: doc } = await supabase.from('documents').select('*').eq('id', documentId).single<DocumentRow>()
  if (!doc) return { error: 'Document not found.' }
  if (doc.status !== 'verified' || !doc.extracted_json) return { error: 'Document has not been parsed yet.' }

  const { data: lead } = await supabase.from('leads').select('*').eq('id', doc.lead_id).single<Lead>()
  if (!lead) return { error: 'Lead not found.' }

  const proposed = mapExtractedToLeadPatch(doc.type, doc.extracted_json as Extracted)
  const patch: Record<string, unknown> = {}
  const appliedFields: string[] = []

  for (const [field, value] of Object.entries(proposed)) {
    if (value === null || value === undefined) continue
    const chosen = selectedFields
      ? selectedFields.includes(field)          // explicit choice — may overwrite
      : lead[field as keyof Lead] == null       // default — fill blanks only
    if (!chosen) continue
    if (display(lead[field as keyof Lead]) === display(value)) continue
    patch[field] = value
    appliedFields.push(field)
  }

  if (appliedFields.length === 0) {
    return { error: 'Nothing to apply — no selected field would change the lead.' }
  }

  // RLS filters rows rather than erroring, so check the affected row count.
  const { data: updated, error } = await supabase
    .from('leads')
    .update({
      ...patch,
      fields_from_documents: Array.from(new Set([...(lead.fields_from_documents ?? []), ...appliedFields])),
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id)
    .select('id')

  if (error) return { error: error.message }
  if (!updated || updated.length === 0) return { error: "Could not apply — you don't have access to this lead." }

  revalidatePath(`/partner/leads/${lead.id}`)
  return { ok: true as const, appliedFields }
}
