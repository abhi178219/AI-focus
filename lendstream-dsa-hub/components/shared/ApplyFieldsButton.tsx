'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { applyExtractedFields } from '@/app/actions/applyFields'

export function ApplyFieldsButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  function run() {
    setMessage(null)
    startTransition(async () => {
      const result = await applyExtractedFields(documentId)
      if ('error' in result) setMessage({ text: result.error!, error: true })
      else {
        setMessage({ text: `Applied: ${result.appliedFields!.join(', ')}` })
        router.refresh()
      }
    })
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        onClick={run}
        disabled={pending}
        className="rounded-full border border-[#e2e0da] bg-white px-3 py-1 text-xs font-medium text-[#5f5d58] hover:bg-[#f7f6f4] disabled:opacity-50"
      >
        {pending ? 'Applying…' : 'Apply to lead'}
      </button>
      {message && <span className={`mt-1 max-w-56 text-right text-xs ${message.error ? 'text-red-600' : 'text-[#16694a]'}`}>{message.text}</span>}
    </span>
  )
}
