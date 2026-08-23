'use client'

import { useState, useTransition } from 'react'
import { Sparkles } from 'lucide-react'
import { generateCaseNarrative } from '@/app/actions/narrative'

export function NarrativeCard({ leadId, narrative, generatedAt }: { leadId: string; narrative: string | null; generatedAt: string | null }) {
  const [text, setText] = useState(narrative)
  const [at, setAt] = useState(generatedAt)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateCaseNarrative(leadId)
      if ('error' in result) setError(result.error!)
      else { setText(result.narrative!); setAt(new Date().toISOString()) }
    })
  }

  return (
    <div className="rounded-2xl border border-[#efeeeb] bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#7c7a75]">
          <Sparkles size={13} /> AI case summary
        </div>
        <button onClick={generate} disabled={pending} className="text-xs font-medium text-[#1a1917] hover:underline disabled:opacity-50">
          {pending ? 'Generating…' : text ? 'Regenerate' : 'Generate'}
        </button>
      </div>
      {text ? (
        <p className="text-sm leading-relaxed text-[#1a1917]">{text}</p>
      ) : (
        <p className="text-sm text-[#7c7a75]">No summary yet — generate one from the current lead and assessment data.</p>
      )}
      {at && <div className="mt-2 text-[10px] text-[#c9c7c1]">Generated {new Date(at).toLocaleString('en-IN')} by local model</div>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
