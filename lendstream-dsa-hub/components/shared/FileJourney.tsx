'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { updateLeadStage } from '@/app/actions/leads'
import { LEAD_STAGES, STAGE_LABELS, STAGE_DESCRIPTIONS, type Lead, type LeadStage } from '@/lib/types'

/** Stages that form the linear journey — DROPPED is a terminal exit, not a step. */
const JOURNEY: LeadStage[] = LEAD_STAGES.filter((s) => s !== 'DROPPED')

/**
 * The prototype's "File journey" rail: current stage, progress, a stage
 * picker with a note, and a clickable stepper showing what's done.
 */
export function FileJourney({ lead, leadId }: { lead: Lead; leadId: string }) {
  const router = useRouter()
  const [target, setTarget] = useState<LeadStage | null>(null)
  const [pending, startTransition] = useTransition()
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const currentIndex = JOURNEY.indexOf(lead.stage)
  const stepNumber = currentIndex + 1
  const pctDone = ((currentIndex + 1) / JOURNEY.length) * 100

  function confirm() {
    if (!target) return
    const note = noteRef.current?.value ?? ''
    startTransition(async () => {
      await updateLeadStage(leadId, target, note)
      setTarget(null)
      router.refresh()
    })
  }

  return (
    <section className="rounded-[28px] border border-[#e5e2dd] bg-white p-5 elev overflow-hidden">
      <div className="pb-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[.08em] text-[#2440e8]">File overview</p>
        <h2 className="text-[20px] font-bold tracking-[-.02em] text-[#16161a] leading-tight">File journey</h2>
        <p className="mt-0.5 text-[11px] text-[#7c7a75]">{lead.client_name} · {leadId} · {lead.loan_type || '—'}</p>
      </div>

      <div className="pb-0">
        <div className="mt-4 rounded-[20px] border border-[#e7e5e4] bg-[#f5f4f2] px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Current stage</p>
          <p className="text-[16px] font-bold text-[#16161a] leading-tight">{STAGE_LABELS[lead.stage]}</p>
          <p className="text-[11px] text-[#7c7a75] mt-0.5">{STAGE_DESCRIPTIONS[lead.stage]}</p>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-[#e3e2de] overflow-hidden">
          <div className="h-full rounded-full bg-[#2440e8] transition-[width] duration-700" style={{ width: `${pctDone}%` }} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <label htmlFor="move-to" className="text-[11px] font-semibold text-[#47453f]">Move file to</label>
          <span className="text-[10.5px] text-[#7c7a75] tnum">
            {lead.stage === 'DROPPED' ? 'Dropped' : `${stepNumber} of ${JOURNEY.length} stages`}
          </span>
        </div>
        <select
          id="move-to"
          value={target ?? lead.stage}
          onChange={(e) => setTarget(e.target.value as LeadStage)}
          className="mt-1 w-full rounded-xl border border-[#d6d3d1] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#292524] focus:border-[#2440e8] focus:outline-none"
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]} — {STAGE_DESCRIPTIONS[s]}</option>
          ))}
        </select>

        {target && target !== lead.stage && (
          <div className="mt-3 rounded-[14px] bg-[#f8f7f5] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Stage note</p>
            <p className="mt-0.5 text-[11px] text-[#7c7a75] leading-snug">
              Moving to <strong className="text-[#16161a]">{STAGE_LABELS[target]}</strong>. Add context for the team before confirming.
            </p>
            <textarea
              ref={noteRef}
              rows={2}
              placeholder="Why is this file moving?"
              className="mt-2 w-full rounded-[10px] border border-[#dcdbd6] bg-white px-2.5 py-2 text-[12px] focus:border-[#16161a] focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button" onClick={confirm} disabled={pending}
                className="flex-1 rounded-[10px] bg-[#334155] py-2 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {pending ? 'Saving…' : 'Confirm stage change'}
              </button>
              <button
                type="button" onClick={() => setTarget(null)} disabled={pending}
                className="rounded-[10px] border border-[#dcdbd6] bg-white px-3 py-2 text-[12px] font-semibold text-[#57534e] hover:bg-[#f5f4f2]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wide text-[#7c7a75] mb-2">File journey</p>
          <div className="space-y-1.5">
            {JOURNEY.map((s, i) => {
              const done = i < currentIndex
              const current = i === currentIndex
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTarget(s)}
                className={`flex w-full items-start gap-2.5 rounded-[13px] border border-transparent px-2.5 py-2 text-left transition-colors ${
                    current ? 'border-[#d6d3d1] bg-[#f5f4f2]' : 'bg-white hover:bg-[#faf9f7]'
                  }`}
                >
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                    done ? 'bg-[#1a7f5a] text-white' : current ? 'bg-[#16161a] text-white' : 'border border-[#d6d3d1] bg-[#fafaf9] text-[#64748b]'
                  }`}>
                    {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-[#16161a] leading-tight">{STAGE_LABELS[s]}</span>
                    <span className="block text-[10.5px] text-[#7c7a75] leading-snug">{STAGE_DESCRIPTIONS[s]}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
