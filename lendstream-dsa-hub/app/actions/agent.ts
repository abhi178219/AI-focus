'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { decideWithAgent } from '@/lib/agent/skills/decide'
import { agentAvailable } from '@/lib/agent/runtime'
import { computeAssessment } from '@/lib/decision/rulesEngine'
import type { DocumentRow, Lead, Product } from '@/lib/types'

/**
 * Runs the credit-analyst agent over a lead and records the result.
 *
 * Two things happen on every run, deliberately:
 *  1. The agent's verdict is stored with its full trace — input snapshot, every
 *     tool call and result, the raw reasoning. A decision stays explainable
 *     after the fact even though a model produced it.
 *  2. The deterministic rules engine is evaluated on the same file and its
 *     verdict stored alongside as `reference_verdict`. That gives a permanent
 *     divergence trail between the learned system and the written policy.
 */
export async function runDecisionAgent(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  const health = await agentAvailable()
  if (!health.ok) {
    return { error: `Agent model unreachable — ${health.error ?? 'Ollama is not responding'}. Start Ollama and try again.` }
  }

  const [{ data: lead }, { data: documents }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', leadId).single<Lead>(),
    supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>(),
  ])
  if (!lead) return { error: 'Lead not found.' }

  // Open the audit row before the run, so a crash mid-run still leaves a trace.
  const { data: run } = await supabase
    .from('agent_runs')
    .insert({
      lead_id: leadId,
      skill: 'DECIDE',
      model: process.env.OLLAMA_AGENT_MODEL ?? 'hermes3:8b',
      status: 'running',
      input_snapshot: {
        requested_amount: Number(lead.requested_amount),
        loan_type: lead.loan_type,
        monthly_income: lead.monthly_income,
        cibil_score: lead.cibil_score,
        document_types: (documents ?? []).map((d) => d.type),
      },
      created_by: user.id,
    })
    .select('id')
    .single()

  const result = await decideWithAgent(leadId)

  // The written policy's own answer, for comparison. Never shown as the verdict.
  let referenceVerdict: string | null = null
  let referenceScore: number | null = null
  try {
    const categories = lead.loan_type === 'BOTH' ? ['PL', 'HL'] : [lead.loan_type]
    const { data: product } = await supabase
      .from('products').select('*').in('category', categories).eq('is_active', true)
      .order('min_interest_rate').limit(1).maybeSingle<Product>()
    if (product) {
      const reference = computeAssessment(lead, documents ?? [], product)
      referenceVerdict = reference.verdict
      referenceScore = reference.composite_score
    }
  } catch {
    // The reference is a comparison aid; its absence must not fail the run.
  }

  if (run?.id) {
    await supabase.from('agent_runs').update({
      status: result.ok ? 'succeeded' : 'failed',
      tool_calls: result.toolCalls,
      output: result.output ?? null,
      reasoning: result.reasoning?.slice(0, 8000) ?? null,
      error: result.error ?? null,
      latency_ms: result.latencyMs,
      reference_verdict: referenceVerdict,
      reference_score: referenceScore,
    }).eq('id', run.id)
  }

  if (!result.ok || !result.output) {
    return { error: result.error ?? 'The agent did not return a usable decision.' }
  }

  revalidatePath(`/partner/leads/${leadId}`)
  return {
    ok: true as const,
    decision: result.output,
    runId: run?.id ?? null,
    reference: referenceVerdict ? { verdict: referenceVerdict, score: referenceScore } : null,
    latencyMs: result.latencyMs,
    toolCallCount: result.toolCalls.length,
  }
}

/**
 * Records what actually happened to a file. This is the outcome signal the
 * decision agent learns from, so it is captured explicitly rather than inferred
 * from a stage change — a stage can move for reasons unrelated to credit.
 */
export async function recordDecisionOutcome(
  leadId: string,
  actualOutcome: 'SANCTIONED' | 'DECLINED' | 'DISBURSED' | 'DROPPED' | 'DEFAULTED',
  opts?: { amount?: number | null; notes?: string | null },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  // Attach the most recent agent decision so prediction and outcome are paired.
  const { data: lastRun } = await supabase
    .from('agent_runs')
    .select('id, output')
    .eq('lead_id', leadId).eq('skill', 'DECIDE').eq('status', 'succeeded')
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  const predicted = (lastRun?.output ?? null) as { verdict?: string; composite_score?: number } | null

  const { data, error } = await supabase.from('decision_outcomes').insert({
    lead_id: leadId,
    agent_run_id: lastRun?.id ?? null,
    predicted_verdict: predicted?.verdict ?? null,
    predicted_score: predicted?.composite_score ?? null,
    actual_outcome: actualOutcome,
    actual_amount: opts?.amount ?? null,
    notes: opts?.notes ?? null,
    recorded_by: user.id,
  }).select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not record — you don't have access to this lead." }

  revalidatePath(`/partner/leads/${leadId}`)
  return { ok: true as const }
}
