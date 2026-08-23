'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { updateLeadStage } from '@/app/actions/leads'
import { LEAD_STAGES, STAGE_LABELS, STAGE_PILL_STYLE, type LeadStage } from '@/lib/types'
import { Badge } from '@/components/shared/Badge'

export function StageSelect({ leadId, stage }: { leadId: string; stage: LeadStage }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [nextStage, setNextStage] = useState<LeadStage>(stage)
  const [pending, startTransition] = useTransition()
  const noteRef = useRef<HTMLTextAreaElement>(null)

  function openPanel() {
    setNextStage(stage)
    setOpen(true)
  }

  function confirm() {
    const note = noteRef.current?.value ?? ''
    startTransition(async () => {
      await updateLeadStage(leadId, nextStage, note)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openPanel}
        className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-[#1a1917] shadow-sm hover:bg-[#f7f6f4]"
      >
        <Badge className={STAGE_PILL_STYLE}>{STAGE_LABELS[stage]}</Badge>
        <ChevronDown size={14} className="text-[#7c7a75]" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 rounded-2xl bg-white p-4 shadow-md">
          <label className="mb-1 block text-xs font-medium text-[#7c7a75]">Move to stage</label>
          <select
            value={nextStage}
            onChange={(e) => setNextStage(e.target.value as LeadStage)}
            className="mb-3 w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          >
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
          <label className="mb-1 block text-xs font-medium text-[#7c7a75]">Note (optional)</label>
          <textarea
            ref={noteRef}
            rows={2}
            placeholder="Why is this file moving?"
            className="mb-3 w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="rounded-full bg-[#1a1917] px-3.5 py-1.5 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium text-[#7c7a75] hover:bg-[#f7f6f4]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
