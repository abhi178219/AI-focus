import 'server-only'

import { runAgent, AGENT_MODEL } from '@/lib/agent/runtime'
import { leadTools } from '@/lib/agent/tools'

/**
 * The remaining agent skills. Each is read-only — none is given a tool that
 * writes — and each returns strict JSON so the caller can persist and render it
 * without parsing prose.
 */

const GROUND_RULES = `
Work only from tool results. Never state a figure you have not read from a tool.
If something cannot be determined, say so explicitly rather than estimating.
Return ONLY a JSON object with no prose around it.`

/* ---------------------------------------------------------------- doc QC */

export interface QcFinding {
  severity: 'INFO' | 'WATCH' | 'CRITICAL'
  category: string
  finding: string
  evidence: string
}
export interface QcReport {
  findings: QcFinding[]
  cross_document_consistent: boolean
  summary: string
}

export async function runDocumentQc(leadId: string) {
  return runAgent<QcReport>({
    system: `You are a document QC reviewer on a lending file. Look for problems a credit officer would want flagged BEFORE the file is submitted.

Check for:
- Contradictions between documents (GST turnover vs banking credits vs declared financials)
- Statement periods that do not line up, or gaps in the months on file
- Names that differ across documents
- Figures that are internally implausible (debits exceeding credits every month, drawing power above the sanctioned limit)
- Required documents for the product that are absent

Severity: CRITICAL blocks submission, WATCH needs a human look, INFO is context.
${GROUND_RULES}

{"findings":[{"severity":"INFO|WATCH|CRITICAL","category":"short label","finding":"what is wrong","evidence":"the figures or documents that show it"}],"cross_document_consistent":true|false,"summary":"one sentence"}`,
    user: `QC lead ${leadId}. Read the documents, the sections and the product policy first.`,
    tools: leadTools(leadId),
    model: AGENT_MODEL,
  })
}

/* ------------------------------------------------------- credit narrative */

export interface NarrativeOutput {
  headline: string
  narrative: string
  strengths: string[]
  concerns: string[]
  recommendation: string
}

export async function runCreditNarrative(leadId: string) {
  return runAgent<NarrativeOutput>({
    system: `You are a credit analyst writing the banker summary that accompanies a file to the lender.

Write for a credit officer who has not seen the file. Be specific and cite figures. No marketing language, no hedging filler. If capacity could not be assessed, say why.
${GROUND_RULES}

{"headline":"one line naming the applicant, product and ask","narrative":"3-5 sentences","strengths":["..."],"concerns":["..."],"recommendation":"what you are asking the lender to do"}`,
    user: `Write the banker summary for lead ${leadId}.`,
    tools: leadTools(leadId),
    model: AGENT_MODEL,
  })
}

/* ------------------------------------------------------- next best action */

export interface NextAction {
  priority: number
  action: string
  reason: string
  owner: 'PARTNER' | 'CUSTOMER' | 'LENDER'
}
export interface NextActionPlan {
  blocking_submission: string[]
  actions: NextAction[]
  customer_message: string
}

export async function runNextBestAction(leadId: string) {
  return runAgent<NextActionPlan>({
    system: `You work out what is blocking this file and what to do next.

Compare what the product requires against what is on file. Order actions by what unblocks submission soonest. Draft a short, plain message the partner can send the customer asking for exactly what is missing — no jargon, no apology padding.
${GROUND_RULES}

{"blocking_submission":["..."],"actions":[{"priority":1,"action":"...","reason":"...","owner":"PARTNER|CUSTOMER|LENDER"}],"customer_message":"the message to send"}`,
    user: `What is blocking lead ${leadId}, and what should happen next?`,
    tools: leadTools(leadId),
    model: AGENT_MODEL,
  })
}
