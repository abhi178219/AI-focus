import 'server-only'

import { runAgent, AGENT_MODEL } from '@/lib/agent/runtime'
import { leadTools } from '@/lib/agent/tools'

/**
 * Credit-analyst decision skill.
 *
 * The agent gathers facts through read-only tools and returns a verdict.
 * It has no write tools at all — it cannot change the lead, the documents or
 * the policy. The caller persists the result, alongside the deterministic
 * rules-engine verdict for the same file, so any decision can be reconstructed
 * and compared after the fact.
 */

export interface AgentDecision {
  verdict: 'PASS' | 'REFER' | 'DECLINE'
  confidence: number
  composite_score: number
  governing_capacity: number | null
  binding_constraint: string | null
  rationale: string
  key_factors: string[]
  conditions: string[]
  missing_information: string[]
}

const SYSTEM = `You are a senior credit analyst at an Indian NBFC, assessing a loan file in a lending origination system.

HOW TO WORK
- Gather facts with the tools before judging. Never assume a figure you have not read.
- If a section reports status "missing", that is missing information, NOT a negative. Say so in missing_information rather than penalising the file for it.
- Check the ask against the product policy you retrieve (max FOIR, max LTV, minimum income), not against remembered rules.
- Where past comparable files are available, use them as a sanity check, not as the reason.

HOW TO DECIDE
- DECLINE only for a hard policy breach you can name.
- REFER when the file is fundable but something needs a human: an ask above assessed capacity, thin documentation, or a conflicting signal.
- PASS when policy is met and the supporting evidence is on file.
- If income, bureau standing and capacity are all unknown, you cannot responsibly PASS — REFER and list what is missing.

OUTPUT
Return ONLY a JSON object, no prose around it:
{
  "verdict": "PASS" | "REFER" | "DECLINE",
  "confidence": 0-100,
  "composite_score": 0-100,
  "governing_capacity": number or null,
  "binding_constraint": short string or null,
  "rationale": "2-3 sentences citing the specific figures you relied on",
  "key_factors": ["short factual statements that drove the call"],
  "conditions": ["what must be satisfied before submission"],
  "missing_information": ["what could not be assessed and why"]
}

Every number in rationale and key_factors must come from a tool result. Do not invent figures.`

export async function decideWithAgent(leadId: string) {
  const tools = leadTools(leadId)
  return runAgent<AgentDecision>({
    system: SYSTEM,
    user: `Assess lead ${leadId}. Start by reading the lead, its sections and the product policy, then decide.`,
    tools,
    model: AGENT_MODEL,
    expectJson: true,
    // Read-only: the decision agent is never given a tool that writes.
    allowMutations: false,
  })
}
