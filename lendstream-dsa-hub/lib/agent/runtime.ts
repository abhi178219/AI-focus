import 'server-only'

/**
 * Agent runtime — a tool-calling loop over a local Ollama model.
 *
 * Two models, chosen for what this 8 GB M1 can actually hold:
 *   - AGENT_MODEL drives reasoning and tool calls.
 *   - EXTRACT_MODEL (gemma3:4b) does document extraction.
 *
 * Model choice is not arbitrary:
 *   - hermes3:3b was tried and REJECTED — it does not emit native `tool_calls`,
 *     it emits malformed pseudo-JSON in the message content. Too small for
 *     reliable structured tool use at any prompt.
 *   - hermes3:8b (NousResearch, on Meta Llama 3.1) is the agent brain. It is
 *     purpose-built for function calling.
 *   - gemma4's smallest build is 12b (~8 GB) and does not fit on this machine.
 *
 * RAM NOTE: on an 8 GB box hermes3:8b (~4.7 GB) and gemma3:4b (~3.3 GB) cannot
 * both stay resident, so Ollama swaps them between a decision run and an
 * extraction run. That costs a model load each way. Consolidating onto one
 * model, or moving OLLAMA_HOST to a bigger box, removes the swap.
 *
 * Everything is env-swappable — point OLLAMA_HOST at a GPU host and raise
 * these two vars to scale up without a code change. Verify native tool-calling
 * on any new model before switching to it; several models advertise it and do
 * not actually emit it.
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'
export const AGENT_MODEL = process.env.OLLAMA_AGENT_MODEL ?? 'hermes3:8b'
export const EXTRACT_MODEL = process.env.OLLAMA_MODEL ?? 'gemma3:4b'

/** How many tool round-trips before we stop. Keeps a confused model bounded. */
const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS ?? 6)
const STEP_TIMEOUT_MS = Number(process.env.AGENT_STEP_TIMEOUT_MS ?? 120_000)

export interface ToolSpec<TArgs = Record<string, unknown>, TResult = unknown> {
  name: string
  description: string
  /** JSON Schema for the arguments, passed to the model verbatim. */
  parameters: Record<string, unknown>
  /**
   * Tools are READ-ONLY by default. A tool that mutates must set `mutates` and
   * is only offered to the model when the caller explicitly allows mutation.
   */
  mutates?: boolean
  run: (args: TArgs) => Promise<TResult>
}

export interface ToolCallRecord {
  name: string
  args: unknown
  result?: unknown
  error?: string
  ms: number
}

export interface AgentResult<T = unknown> {
  ok: boolean
  output: T | null
  reasoning: string
  toolCalls: ToolCallRecord[]
  error?: string
  latencyMs: number
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[]
  tool_name?: string
}

async function chat(model: string, messages: ChatMessage[], tools: ToolSpec[], json: boolean) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), STEP_TIMEOUT_MS)
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        ...(json ? { format: 'json' } : {}),
        ...(tools.length
          ? {
              tools: tools.map((t) => ({
                type: 'function',
                function: { name: t.name, description: t.description, parameters: t.parameters },
              })),
            }
          : {}),
        options: { temperature: 0.1 },
      }),
    })
    if (!res.ok) throw new Error(`Ollama returned ${res.status}`)
    return await res.json() as {
      message?: { content?: string; tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[] }
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Runs the agent until it answers or the step budget is spent.
 *
 * `allowMutations` gates any tool marked `mutates` — the caller decides, the
 * model never gets to grant itself write access.
 */
export async function runAgent<T = unknown>({
  system,
  user,
  tools = [],
  model = AGENT_MODEL,
  expectJson = true,
  allowMutations = false,
}: {
  system: string
  user: string
  tools?: ToolSpec[]
  model?: string
  expectJson?: boolean
  allowMutations?: boolean
}): Promise<AgentResult<T>> {
  const started = Date.now()
  const offered = tools.filter((t) => allowMutations || !t.mutates)
  const byName = new Map(offered.map((t) => [t.name, t]))
  const toolCalls: ToolCallRecord[] = []
  const messages: ChatMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      // Only ask for JSON on the final answer — tool-call turns need free form.
      const body = await chat(model, messages, offered, false)
      const msg = body.message ?? {}
      const calls = msg.tool_calls ?? []

      if (calls.length === 0) {
        const content = msg.content ?? ''
        if (!expectJson) {
          return { ok: true, output: content as unknown as T, reasoning: content, toolCalls, latencyMs: Date.now() - started, model }
        }

        const parsed = safeJson<T>(content)
        if (parsed !== null) {
          return { ok: true, output: parsed, reasoning: content, toolCalls, latencyMs: Date.now() - started, model }
        }

        // Models routinely answer in prose even when the system prompt demands
        // JSON — observed with hermes3:8b. Rather than fail the run, re-ask once
        // with Ollama's format:json constraint, giving it the prose it just
        // produced plus the tool results already in context.
        const forced = await chat(
          model,
          [...messages, { role: 'assistant', content }, {
            role: 'user',
            content: 'Return that answer as the JSON object specified in your instructions. JSON only, no prose.',
          }],
          [],
          true,
        )
        const forcedContent = forced.message?.content ?? ''
        const forcedParsed = safeJson<T>(forcedContent)
        if (forcedParsed !== null) {
          return {
            ok: true, output: forcedParsed,
            // Keep the prose: it is the model's actual reasoning and belongs in the audit trail.
            reasoning: content, toolCalls, latencyMs: Date.now() - started, model,
          }
        }

        return {
          ok: false, output: null, reasoning: content, toolCalls,
          error: 'Model did not return parseable JSON, even when constrained to format:json',
          latencyMs: Date.now() - started, model,
        }
      }

      messages.push({ role: 'assistant', content: msg.content ?? '', tool_calls: calls })

      for (const call of calls) {
        const tool = byName.get(call.function.name)
        const t0 = Date.now()
        if (!tool) {
          const err = `Unknown tool: ${call.function.name}`
          toolCalls.push({ name: call.function.name, args: call.function.arguments, error: err, ms: 0 })
          messages.push({ role: 'tool', tool_name: call.function.name, content: JSON.stringify({ error: err }) })
          continue
        }
        try {
          const result = await tool.run(call.function.arguments ?? {})
          toolCalls.push({ name: tool.name, args: call.function.arguments, result, ms: Date.now() - t0 })
          messages.push({ role: 'tool', tool_name: tool.name, content: JSON.stringify(result).slice(0, 8000) })
        } catch (e) {
          const err = (e as Error).message
          toolCalls.push({ name: tool.name, args: call.function.arguments, error: err, ms: Date.now() - t0 })
          messages.push({ role: 'tool', tool_name: tool.name, content: JSON.stringify({ error: err }) })
        }
      }
    }

    return {
      ok: false, output: null, reasoning: '', toolCalls,
      error: `Agent did not settle within ${MAX_STEPS} steps`, latencyMs: Date.now() - started, model,
    }
  } catch (e) {
    return {
      ok: false, output: null, reasoning: '', toolCalls,
      error: `Could not reach Ollama at ${OLLAMA_HOST}: ${(e as Error).message}`,
      latencyMs: Date.now() - started, model,
    }
  }
}

/** Models wrap JSON in prose or fences often enough that this is worth having. */
export function safeJson<T>(raw: string): T | null {
  const attempt = (s: string) => { try { return JSON.parse(s) as T } catch { return null } }
  const direct = attempt(raw.trim())
  if (direct !== null) return direct
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) { const v = attempt(fenced[1].trim()); if (v !== null) return v }
  const braced = raw.match(/\{[\s\S]*\}/)
  if (braced) { const v = attempt(braced[0]); if (v !== null) return v }
  return null
}

/** True when the runtime can actually reach a model — used for honest empty states. */
export async function agentAvailable(): Promise<{ ok: boolean; models: string[]; error?: string }> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { cache: 'no-store' })
    if (!res.ok) return { ok: false, models: [], error: `Ollama returned ${res.status}` }
    const body = await res.json() as { models?: { name: string }[] }
    return { ok: true, models: (body.models ?? []).map((m) => m.name) }
  } catch (e) {
    return { ok: false, models: [], error: (e as Error).message }
  }
}
