'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { buildSections, sectionFacts, type SectionCode } from '@/lib/decision/sections'
import type { Lead, DocumentRow } from '@/lib/types'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma3:4b'

type Result = { summary: string; generatedAt: string; model: string } | { error: string }

// Same pattern as generateCaseNarrative (app/actions/narrative.ts), one
// summary per (lead, section) instead of one per lead. Genuinely generated
// by the local LLM from this section's own already-computed, already-
// displayed figures — never from raw extracted_json, and never invented.
export async function generateSectionSummary(leadId: string, sectionCode: SectionCode): Promise<Result> {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single<Lead>()
  if (!lead) return { error: 'Lead not found.' }

  const { data: documents } = await supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>()
  const section = buildSections(lead, documents ?? []).find((s) => s.key === sectionCode)
  if (!section || section.status !== 'ready') {
    return { error: 'Nothing on file yet for this section to summarize.' }
  }

  const facts = sectionFacts(section)
  const prompt = `Write a concise 2-3 sentence underwriting summary of the ${section.label} section of a loan file, for a credit manager reviewing it. Plain factual tone, no markdown, no bullet points, third person. Only state facts given below — do not invent numbers or claims not present in them.\n\n${facts}`

  let response: Response
  try {
    response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, stream: false }),
    })
  } catch (err) {
    return { error: `Could not reach local model: ${(err as Error).message}` }
  }
  if (!response.ok) return { error: 'Local model unavailable.' }

  const body = await response.json() as { response: string }
  const summary = body.response.trim()
  if (!summary) return { error: 'Local model returned an empty summary.' }

  const generatedAt = new Date().toISOString()
  // RLS filters rather than errors, so check the row count rather than
  // trusting the absence of `error` alone.
  const { data, error } = await supabase
    .from('section_summaries')
    .upsert({ lead_id: leadId, section_code: sectionCode, summary, model: MODEL, generated_at: generatedAt }, { onConflict: 'lead_id,section_code' })
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this lead." }

  revalidatePath(`/partner/leads/${leadId}`)
  return { summary, generatedAt, model: MODEL }
}
