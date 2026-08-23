import { z } from 'zod'

// Fixed allowlist of chat-triggerable actions. No verdict field, no
// disbursed_amount, no bank_assigned, no destructive/underwriting mutation —
// hard-blocked by simply not existing as a tool. See
// /decisions/2026-08-22-lendstream-dsa-hub-architecture.md (Copilot section)
// for the reasoning (independent Codex review of this design).

export const moveLeadStageSchema = z.object({
  lead_id: z.string().uuid(),
  target_stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTATION', 'ASSESSMENT', 'LOGGED_IN', 'DROPPED']),
  reason: z.string().max(300).nullable(),
})

export const createLeadSchema = z.object({
  client_name: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  loan_type: z.enum(['PL', 'HL', 'LAP', 'BOTH']),
  requested_amount: z.number().positive(),
  monthly_income: z.number().positive().nullable(),
})

export const requestCrmSyncSchema = z.object({
  lead_id: z.string().uuid(),
})

export const shareQuoteSchema = z.object({
  lead_id: z.string().uuid(),
})

export const addInteractionNoteSchema = z.object({
  lead_id: z.string().uuid(),
  note: z.string().min(1).max(500),
  channel: z.enum(['CALL', 'WHATSAPP', 'EMAIL', 'BRANCH_MEETING', 'FIELD_VISIT']),
})

// Plain union (not discriminatedUnion) — a discriminated union requires the
// discriminator key ('type') to be unique per branch, but every proposal
// branch here shares type:'proposal', varying only on the nested 'action'
// literal. safeParse just tries each branch in order, which is fine at this
// size and avoids that constraint entirely.
export const copilotTurnSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('proposal'), action: z.literal('move_lead_stage'), params: moveLeadStageSchema, rationale: z.string().max(300) }),
  z.object({ type: z.literal('proposal'), action: z.literal('create_lead'), params: createLeadSchema, rationale: z.string().max(300) }),
  z.object({ type: z.literal('proposal'), action: z.literal('request_crm_sync'), params: requestCrmSyncSchema, rationale: z.string().max(300) }),
  z.object({ type: z.literal('proposal'), action: z.literal('add_interaction_note'), params: addInteractionNoteSchema, rationale: z.string().max(300) }),
  z.object({ type: z.literal('proposal'), action: z.literal('share_quote'), params: shareQuoteSchema, rationale: z.string().max(300) }),
])

export type CopilotTurn = z.infer<typeof copilotTurnSchema>
export type CopilotActionName = Extract<CopilotTurn, { type: 'proposal' }>['action']
