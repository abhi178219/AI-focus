'use client'

import { useState, useTransition } from 'react'
import { Send } from 'lucide-react'
import { runCopilotTurn, confirmCopilotAction, type CopilotMessage } from '@/app/actions/copilot'
import type { CopilotActionName } from '@/lib/copilot/schema'

type Turn =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; kind: 'text'; text: string }
  | {
      id: number
      role: 'assistant'
      kind: 'proposal'
      action: CopilotActionName
      params: Record<string, unknown>
      rationale: string
      status: 'pending' | 'confirmed' | 'cancelled'
      resultMessage?: string
      draft?: string
    }

const QUICK_ACTIONS = ['Onboard a new lead', 'Move a lead to the next stage', 'Draft a quote to share', 'Request a CRM sync']

const ACTION_LABEL: Record<CopilotActionName, string> = {
  move_lead_stage: 'Move lead stage',
  create_lead: 'Create new lead',
  request_crm_sync: 'Request CRM sync',
  add_interaction_note: 'Log interaction',
  share_quote: 'Draft a quote to share',
}

let idCounter = 0

export function CopilotPanel({ activeLeadId, onClose }: { activeLeadId: string | null; onClose: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([
    { id: idCounter++, role: 'assistant', kind: 'text', text: "Hi, I'm the RB-Stream AI Copilot. I can help you onboard leads, move stages, draft quotes, and request CRM syncs — I'll always show you exactly what I'm about to do before it happens." },
  ])
  const [input, setInput] = useState('')
  const [pending, startTransition] = useTransition()

  function history(): CopilotMessage[] {
    return turns
      .filter((t) => t.role === 'user' || t.kind === 'text')
      .map((t) => ({ role: t.role, text: t.role === 'user' ? t.text : (t as { text: string }).text }))
  }

  function send(text: string) {
    if (!text.trim()) return
    const userTurn: Turn = { id: idCounter++, role: 'user', text }
    setTurns((prev) => [...prev, userTurn])
    setInput('')
    startTransition(async () => {
      const result = await runCopilotTurn([...history(), { role: 'user', text }], {
        activeLeadId, activeLeadSummary: null,
      })
      if (result.type === 'text') {
        setTurns((prev) => [...prev, { id: idCounter++, role: 'assistant', kind: 'text', text: result.text }])
      } else {
        setTurns((prev) => [...prev, {
          id: idCounter++, role: 'assistant', kind: 'proposal',
          action: result.action, params: result.params, rationale: result.rationale, status: 'pending',
        }])
      }
    })
  }

  function respond(turnId: number, confirm: boolean) {
    const turn = turns.find((t) => t.id === turnId)
    if (!turn || turn.role !== 'assistant' || turn.kind !== 'proposal') return
    if (!confirm) {
      setTurns((prev) => prev.map((t) => (t.id === turnId ? { ...t, status: 'cancelled' } : t)))
      return
    }
    startTransition(async () => {
      const result = await confirmCopilotAction(turn.action, turn.params)
      setTurns((prev) => prev.map((t) => t.id === turnId
        ? { ...t, status: 'confirmed', resultMessage: 'error' in result ? `Failed: ${result.error}` : (result as { message?: string }).message, draft: 'draft' in result ? result.draft : undefined }
        : t))
    })
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex h-[580px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-white/40 bg-[#f7f6f4] shadow-2xl">
      <div className="flex items-center justify-between bg-[#16161a] px-4 py-4 text-white">
        <div>
          <div className="text-sm font-extrabold">AI Copilot</div>
          <div className="text-xs text-white/60">Always asks before acting</div>
        </div>
        <button onClick={onClose} className="text-xs text-white/70 hover:text-white">Close</button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        {turns.map((turn) => {
          if (turn.role === 'user') {
            return (
              <div key={turn.id} className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-[#1a1917] px-3 py-2 text-sm text-white">
                {turn.text}
              </div>
            )
          }
          if (turn.kind === 'text') {
            return (
              <div key={turn.id} className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#f7f6f4] px-3 py-2 text-sm text-[#1a1917]">
                {turn.text}
              </div>
            )
          }
          return (
            <div key={turn.id} className="max-w-[95%] rounded-2xl border border-[#efeeeb] bg-[#f7f6f4] p-3 text-sm">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#7c7a75]">AI-proposed · {ACTION_LABEL[turn.action]}</div>
              <div className="mb-2 text-[#1a1917]">{turn.rationale}</div>
              <div className="mb-2 space-y-0.5 text-xs text-[#5f5d58]">
                {Object.entries(turn.params).filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k}>{k}: <span className="text-[#1a1917]">{String(v)}</span></div>
                ))}
              </div>
              {turn.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => respond(turn.id, true)} disabled={pending} className="rounded-full bg-[#1a1917] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">Confirm</button>
                  <button onClick={() => respond(turn.id, false)} disabled={pending} className="rounded-full border border-[#dcdad4] px-3 py-1.5 text-xs font-medium text-[#5f5d58]">Cancel</button>
                </div>
              )}
              {turn.status === 'cancelled' && <div className="text-xs text-[#7c7a75]">Cancelled.</div>}
              {turn.status === 'confirmed' && (
                <div className="text-xs text-[#16694a]">
                  {turn.resultMessage}
                  {turn.draft && (
                    <div className="mt-2 rounded-xl bg-white p-2 text-[#1a1917]">
                      <div className="mb-1 text-[10px] uppercase tracking-wide text-[#7c7a75]">Draft — review before sending</div>
                      {turn.draft}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {pending && <div className="text-xs text-[#7c7a75]">Thinking…</div>}
      </div>

      <div className="border-t border-[#efeeeb] px-3 py-2">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK_ACTIONS.map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] text-[#5f5d58] hover:bg-[#e2e0da]">
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the copilot…"
            className="flex-1 rounded-full border border-[#e2e0da] px-3 py-2 text-sm focus:outline-none"
          />
          <button type="submit" disabled={pending} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1917] text-white disabled:opacity-60">
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  )
}
