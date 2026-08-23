'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { applyExtractedFields, previewExtractedFields } from '@/app/actions/applyFields'

interface FieldProposal {
  field: string
  label: string
  current: string | null
  extracted: string
  conflict: boolean
}

/**
 * "Apply to lead" — previews what the parsed document would change and lets the
 * user choose field by field before anything is written.
 *
 * Fields the lead has not got yet are pre-selected. A field that would OVERWRITE
 * something already on the lead is left unselected and flagged, so a document
 * can never quietly replace a value the user typed — but they can opt in.
 */
export function ApplyFieldsButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [proposals, setProposals] = useState<FieldProposal[] | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)

  function openPreview() {
    setMessage(null)
    start(async () => {
      const result = await previewExtractedFields(documentId)
      if ('error' in result && result.error) { setMessage({ text: result.error, error: true }); return }
      const list = result.proposals ?? []
      if (list.length === 0) {
        setMessage({ text: 'Nothing to apply — the lead already matches this document.' })
        return
      }
      setProposals(list)
      // Pre-select only the fields that fill a gap; conflicts are opt-in.
      setSelected(list.filter((p) => !p.conflict).map((p) => p.field))
    })
  }

  function apply() {
    start(async () => {
      const result = await applyExtractedFields(documentId, selected)
      if ('error' in result && result.error) { setMessage({ text: result.error, error: true }); return }
      setProposals(null)
      setMessage({ text: `Applied ${result.appliedFields!.length} field${result.appliedFields!.length === 1 ? '' : 's'}.` })
      router.refresh()
    })
  }

  const toggle = (f: string) =>
    setSelected((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]))

  if (!proposals) {
    return (
      <span className="inline-flex flex-col items-end">
        <button
          onClick={openPreview}
          disabled={pending}
          className="rounded-full border border-[#dcdbd6] bg-white px-3 py-1 text-[11.5px] font-medium text-[#5f5d58] hover:bg-[#f7f6f4] disabled:opacity-50"
        >
          {pending ? 'Checking…' : 'Apply to lead'}
        </button>
        {message && (
          <span className={`mt-1 max-w-56 text-right text-[11px] ${message.error ? 'text-red-600' : 'text-[#16694a]'}`}>
            {message.text}
          </span>
        )}
      </span>
    )
  }

  const conflicts = proposals.filter((p) => p.conflict).length

  return (
    <div className="w-[420px] rounded-[20px] bg-white p-4 text-left shadow-md">
      <p className="text-[12.5px] font-semibold text-[#16161a]">Apply to lead</p>
      <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c7a75]">
        Choose what to write onto the lead.
        {conflicts > 0 && ` ${conflicts} field${conflicts === 1 ? '' : 's'} would overwrite an existing value — tick to replace.`}
      </p>

      <div className="mt-3 space-y-1.5">
        {proposals.map((p) => (
          <label
            key={p.field}
            className={`flex cursor-pointer items-start gap-2.5 rounded-[14px] px-3 py-2 ${p.conflict ? 'bg-[#f7f0e2]' : 'bg-[#efeeeb]'}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(p.field)}
              onChange={() => toggle(p.field)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#1a1917]"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-[11.5px] font-semibold text-[#16161a]">{p.label}</span>
              <span className="flex flex-wrap items-center gap-1.5 text-[11px] tnum">
                <span className={p.current ? 'text-[#7c7a75] line-through' : 'text-[#a8a6a0]'}>
                  {p.current ?? 'empty'}
                </span>
                <ArrowRight size={10} className="text-[#a8a6a0]" />
                <span className="font-semibold text-[#16161a]">{p.extracted}</span>
              </span>
            </span>
            {p.conflict && (
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[9.5px] font-bold uppercase text-[#85580d]">
                Overwrite
              </span>
            )}
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={apply}
          disabled={pending || selected.length === 0}
          className="rounded-full bg-[#1a1917] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Applying…' : `Apply ${selected.length} field${selected.length === 1 ? '' : 's'}`}
        </button>
        <button
          onClick={() => { setProposals(null); setMessage(null) }}
          disabled={pending}
          className="rounded-full px-3 py-2 text-[12px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]"
        >
          Cancel
        </button>
      </div>
      {message?.error && <p className="mt-2 text-[11px] text-red-600">{message.text}</p>}
    </div>
  )
}
