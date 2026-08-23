'use server'

import { createClient } from '@/lib/supabase/server'
import { copilotTurnSchema, type CopilotActionName } from '@/lib/copilot/schema'
import { buildSystemPrompt, type CopilotContext } from '@/lib/copilot/prompt'

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma3:4b'

export interface CopilotMessage { role: 'user' | 'assistant'; text: string }

export async function runCopilotTurn(history: CopilotMessage[], ctx: CopilotContext) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { type: 'text' as const, text: 'You need to be signed in.' }

  const prompt = [
    buildSystemPrompt(ctx),
    '',
    ...history.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`),
    'Assistant:',
  ].join('\n')

  let response: Response
  try {
    response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, format: 'json', stream: false }),
    })
  } catch (err) {
    return { type: 'text' as const, text: `Copilot is unavailable — could not reach the local model (${(err as Error).message}).` }
  }
  if (!response.ok) return { type: 'text' as const, text: 'Copilot is unavailable right now.' }

  const body = await response.json() as { response: string }
  let parsed: unknown
  try {
    parsed = JSON.parse(body.response)
  } catch {
    return { type: 'text' as const, text: body.response.slice(0, 800) }
  }

  const result = copilotTurnSchema.safeParse(parsed)
  if (!result.success) return { type: 'text' as const, text: 'text' in (parsed as any) ? String((parsed as any).text) : 'Sorry, I could not process that.' }

  // Ownership check on any lead_id the model referenced — RLS would also
  // block a cross-agent read/write, but failing fast here gives a clearer
  // error than a silent empty result.
  if (result.data.type === 'proposal' && 'lead_id' in result.data.params) {
    const { data: lead } = await supabase.from('leads').select('id').eq('id', (result.data.params as { lead_id: string }).lead_id).maybeSingle()
    if (!lead) return { type: 'text' as const, text: "I can't find that lead, or you don't have access to it." }
  }

  return result.data
}

async function requireLead(leadId: string) {
  const supabase = await createClient()
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single()
  if (error || !lead) throw new Error('Lead not found or not accessible.')
  return { supabase, lead }
}

// Every branch here runs through the normal RLS-scoped client (createClient()),
// never the service-role client — a confirmed copilot action can only do what
// the signed-in user could already do by hand. See lib/copilot/schema.ts for
// the full allowlist and the hard-blocked fields (verdict, disbursed_amount,
// bank_assigned) that simply have no corresponding action here.
export async function confirmCopilotAction(action: CopilotActionName, params: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not signed in.' }

  switch (action) {
    case 'move_lead_stage': {
      const { moveLeadStageSchema } = await import('@/lib/copilot/schema')
      const p = moveLeadStageSchema.parse(params)
      const { lead } = await requireLead(p.lead_id)
      const { error } = await supabase.from('leads').update({ stage: p.target_stage, updated_at: new Date().toISOString() }).eq('id', lead.id)
      if (error) return { error: error.message }
      return { ok: true, message: `Moved to ${p.target_stage}.` }
    }
    case 'create_lead': {
      const { createLeadSchema } = await import('@/lib/copilot/schema')
      const p = createLeadSchema.parse(params)
      const { data, error } = await supabase.from('leads').insert({
        agent_id: user.id, client_name: p.client_name, phone: p.phone, loan_type: p.loan_type,
        requested_amount: p.requested_amount, monthly_income: p.monthly_income, existing_emis: 0,
      }).select('id').single()
      if (error) return { error: error.message }
      return { ok: true, message: 'Lead created.', leadId: data.id }
    }
    case 'request_crm_sync': {
      const { requestCrmSyncSchema } = await import('@/lib/copilot/schema')
      const p = requestCrmSyncSchema.parse(params)
      const { lead } = await requireLead(p.lead_id)
      const { error } = await supabase.from('leads').update({ crm_synced: true, crm_synced_at: new Date().toISOString() }).eq('id', lead.id)
      if (error) return { error: error.message }
      return { ok: true, message: 'CRM sync requested.' }
    }
    case 'add_interaction_note': {
      const { addInteractionNoteSchema } = await import('@/lib/copilot/schema')
      const p = addInteractionNoteSchema.parse(params)
      await requireLead(p.lead_id)
      const { error } = await supabase.from('interactions').insert({ lead_id: p.lead_id, agent_id: user.id, channel: p.channel, note: p.note })
      if (error) return { error: error.message }
      return { ok: true, message: 'Interaction logged.' }
    }
    case 'share_quote': {
      const { shareQuoteSchema } = await import('@/lib/copilot/schema')
      const p = shareQuoteSchema.parse(params)
      const { lead } = await requireLead(p.lead_id)
      const amount = lead.calculated_eligible_amount ?? lead.requested_amount
      const draft = `Hi ${lead.client_name}, based on your profile you're tentatively eligible for up to ₹${Number(amount).toLocaleString('en-IN')} on a ${lead.loan_type} loan. This is an indicative estimate, subject to final underwriting — happy to walk you through next steps.`
      return { ok: true, draft }
    }
    default:
      return { error: 'Unknown action.' }
  }
}
