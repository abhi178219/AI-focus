'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { DocumentRow, DocumentType, Lead } from '@/lib/types'

type Extracted = Record<string, unknown>

// Only fields a given document type can plausibly speak to — never touches
// client_name/phone/loan_type/requested_amount (those came from the user at
// lead creation). Only fills currently-empty lead fields, so a document
// never silently overwrites something the user already entered by hand.
function mapExtractedToLeadPatch(type: DocumentType, data: Extracted): Partial<Lead> {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  switch (type) {
    case 'SALARY_SLIP': {
      const income = num(data.gross_salary) ?? num(data.net_salary)
      return income ? { monthly_income: income } : {}
    }
    case 'ITR': {
      const annual = num(data.gross_total_income)
      return annual ? { monthly_income: Math.round(annual / 12) } : {}
    }
    // Bank statement deliberately does NOT map to monthly_income — average
    // balance isn't income. lib/decision/rulesEngine.ts already uses it as
    // an income *proxy* for scoring when monthly_income is absent; writing
    // it into the lead record would misrepresent it as verified income.
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
    case 'PAN_CARD': {
      const pan = typeof data.pan_number === 'string' && data.pan_number.trim() ? data.pan_number.trim().toUpperCase() : null
      return pan ? { pan_number: pan } : {}
    }
    default:
      return {}
  }
}

export async function applyExtractedFields(documentId: string) {
  const supabase = await createClient()

  const { data: doc, error: docError } = await supabase.from('documents').select('*').eq('id', documentId).single<DocumentRow>()
  if (docError || !doc) return { error: 'Document not found.' }
  if (doc.status !== 'verified' || !doc.extracted_json) return { error: 'Document has not been parsed yet.' }

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', doc.lead_id).single<Lead>()
  if (leadError || !lead) return { error: 'Lead not found.' }

  const proposed = mapExtractedToLeadPatch(doc.type, doc.extracted_json as Extracted)
  const patch: Partial<Lead> = {}
  const appliedFields: string[] = []
  for (const [key, value] of Object.entries(proposed)) {
    if (lead[key as keyof Lead] == null && value != null) {
      ;(patch as Record<string, unknown>)[key] = value
      appliedFields.push(key)
    }
  }

  if (appliedFields.length === 0) {
    return { error: 'Nothing new to apply — either this document has no matching fields, or the lead already has them filled in.' }
  }

  const { error } = await supabase.from('leads').update({
    ...patch,
    fields_from_documents: Array.from(new Set([...(lead.fields_from_documents ?? []), ...appliedFields])),
    updated_at: new Date().toISOString(),
  }).eq('id', lead.id)
  if (error) return { error: error.message }

  revalidatePath(`/partner/leads/${lead.id}`)
  return { ok: true, appliedFields }
}
