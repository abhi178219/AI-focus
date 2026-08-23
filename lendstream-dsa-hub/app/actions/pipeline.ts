'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { extractText } from '@/lib/ocr/extractText'
import { extractStructured, redactAadhaar } from '@/lib/ai/extractionPrompt'
import { computeAssessment } from '@/lib/decision/rulesEngine'
import type { DocumentRow, Lead, Product } from '@/lib/types'

const PIPELINE_VERSION = 'v1'
const MODEL_NAME = process.env.OLLAMA_MODEL ?? 'gemma3:4b'

// Runs synchronously inline (OCR + local-LLM call) — acceptable for
// local-dev, single-user use; a background job/queue is needed before this
// scales to concurrent users. See decision doc "Trade-offs accepted".
export async function processDocument(documentId: string) {
  const supabase = await createClient()

  const { data: doc, error: fetchError } = await supabase.from('documents').select('*').eq('id', documentId).single<DocumentRow>()
  if (fetchError || !doc) return { error: fetchError?.message ?? 'Document not found' }

  await supabase.from('documents').update({ status: 'parsing' }).eq('id', documentId)

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage.from('lead-documents').download(doc.storage_path)
    if (downloadError || !fileBlob) throw new Error(downloadError?.message ?? 'Could not download file')

    const buffer = Buffer.from(await fileBlob.arrayBuffer())
    let ocrText = await extractText(buffer, doc.file_mime)
    if (doc.type === 'AADHAAR') ocrText = redactAadhaar(ocrText)

    const extraction = await extractStructured(doc.type, ocrText)

    if (extraction.error) {
      await supabase.from('documents').update({
        status: 'rejected',
        ocr_text: ocrText,
        extraction_error: extraction.error,
        extraction_model: MODEL_NAME,
        extraction_pipeline_version: PIPELINE_VERSION,
        processed_at: new Date().toISOString(),
      }).eq('id', documentId)
      revalidatePath(`/partner/leads/${doc.lead_id}`)
      return { error: extraction.error }
    }

    await supabase.from('documents').update({
      status: 'verified',
      ocr_text: ocrText,
      extracted_json: extraction.data,
      extraction_model: MODEL_NAME,
      extraction_pipeline_version: PIPELINE_VERSION,
      extraction_confidence: extraction.confidence,
      processed_at: new Date().toISOString(),
    }).eq('id', documentId)

    revalidatePath(`/partner/leads/${doc.lead_id}`)
    return { ok: true }
  } catch (err) {
    await supabase.from('documents').update({
      status: 'rejected',
      extraction_error: (err as Error).message,
      processed_at: new Date().toISOString(),
    }).eq('id', documentId)
    revalidatePath(`/partner/leads/${doc.lead_id}`)
    return { error: (err as Error).message }
  }
}

export async function runAssessment(leadId: string) {
  const supabase = await createClient()

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single<Lead>()
  if (leadError || !lead) return { error: leadError?.message ?? 'Lead not found' }

  const { data: documents } = await supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>()

  let product: Product | null = null
  if (lead.product_id) {
    const { data } = await supabase.from('products').select('*').eq('id', lead.product_id).single<Product>()
    product = data
  } else {
    const category = lead.loan_type === 'BOTH' ? 'PL' : lead.loan_type
    const { data } = await supabase.from('products').select('*').eq('category', category).eq('is_active', true).limit(1).maybeSingle<Product>()
    product = data
  }

  if (!product) return { error: 'No matching product found to assess against.' }

  const result = computeAssessment(lead, documents ?? [], product)

  const { data: assessment, error: insertError } = await supabase.from('assessments').insert({
    lead_id: leadId,
    composite_score: result.composite_score,
    composite_band: result.composite_band,
    verdict: result.verdict,
    knockouts: result.knockouts,
    governing_capacity: result.governing_capacity,
    binding_constraint: result.binding_constraint,
    dscr: result.dscr,
    dscr_band: result.dscr_band,
    proposed_emi: result.proposed_emi,
    recommendation: result.recommendation,
    watch_items: result.watch_items,
    source_document_ids: (documents ?? []).map((d) => d.id),
    rules_version: 'v1',
  }).select('id').single()

  if (insertError || !assessment) return { error: insertError?.message ?? 'Could not save assessment' }

  const pillarRows = result.pillars.filter((p) => p.applicable).map((p) => ({
    assessment_id: assessment.id,
    pillar_code: p.pillar_code,
    score: p.score,
    band: p.band,
    headline: p.headline,
    signals: p.signals,
  }))
  if (pillarRows.length > 0) {
    await supabase.from('assessment_pillars').insert(pillarRows)
  }

  await supabase.from('leads').update({
    calculated_eligible_amount: result.governing_capacity,
    stage: lead.stage === 'DOCUMENTATION' || lead.stage === 'NEW' || lead.stage === 'CONTACTED' || lead.stage === 'QUALIFIED' ? 'ASSESSMENT' : lead.stage,
    updated_at: new Date().toISOString(),
  }).eq('id', leadId)

  revalidatePath(`/partner/leads/${leadId}?tab=assessment`)
  return { ok: true }
}
