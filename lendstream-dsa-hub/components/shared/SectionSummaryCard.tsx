'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { generateSectionSummary } from '@/app/actions/sectionSummary'
import type { SectionCode } from '@/lib/decision/sections'

/** Same interaction pattern as NarrativeCard.tsx (the single overall case
 *  summary) — one of these per section, generated on demand from that
 *  section's own already-computed figures. */
export function SectionSummaryCard({
  leadId, sectionCode, sectionLabel, summary, model, generatedAt,
}: {
  leadId: string
  sectionCode: SectionCode
  sectionLabel: string
  summary: string | null
  model: string | null
  generatedAt: string | null
}) {
  const [text, setText] = useState(summary)
  const [at, setAt] = useState(generatedAt)
  const [usedModel, setUsedModel] = useState(model)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateSectionSummary(leadId, sectionCode)
      if ('error' in result) { setError(result.error); return }
      setText(result.summary)
      setAt(result.generatedAt)
      setUsedModel(result.model)
    })
  }

  return (
    <div className="rounded-2xl border border-[#efeeeb] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#7c7a75]">
          <Sparkles size={13} /> AI summary
        </div>
        <button onClick={generate} disabled={pending} className="text-xs font-medium text-[#1a1917] hover:underline disabled:opacity-50">
          {pending ? 'Generating…' : text ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      {text ? (
        <p className="text-sm leading-relaxed text-[#1a1917]">{text}</p>
      ) : (
        <p className="text-sm text-[#7c7a75]">No summary yet — generate one from the {sectionLabel} figures on this file.</p>
      )}
      {at && <div className="mt-2 text-[10px] text-[#c9c7c1]">Generated {new Date(at).toLocaleString('en-IN')}{usedModel ? ` by ${usedModel}` : ''}</div>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
