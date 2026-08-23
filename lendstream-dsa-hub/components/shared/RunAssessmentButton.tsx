'use client'

import { useState, useTransition } from 'react'
import { processDocument, runAssessment } from '@/app/actions/pipeline'

export function RunAssessmentButton({ kind, id, disabled }: { kind: 'document' | 'lead'; id: string; disabled?: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run() {
    setError(null)
    startTransition(async () => {
      const result = kind === 'document' ? await processDocument(id) : await runAssessment(id)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        onClick={run}
        disabled={disabled || pending}
        className="rounded-full border border-[#e2e0da] bg-white px-3 py-1 text-xs font-medium text-[#5f5d58] hover:bg-[#f7f6f4] disabled:opacity-50"
      >
        {pending ? 'Processing…' : kind === 'document' ? 'Parse' : 'Run assessment'}
      </button>
      {error && <span className="mt-1 max-w-56 text-right text-xs text-red-600">{error}</span>}
    </span>
  )
}
