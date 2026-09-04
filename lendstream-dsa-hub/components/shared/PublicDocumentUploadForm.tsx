'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Circle, UploadCloud } from 'lucide-react'
import { submitPublicDocument } from '@/app/actions/publicSubmissions'
import type { DocumentType } from '@/lib/types'
import { DOC_CATEGORIES, DOC_TYPE_LABEL } from '@/lib/documentCategories'

type State = { error?: string }

/**
 * The customer-facing upload form. Mirrors `DocumentUploadForm`'s shape — an
 * explicit type selector with NO default, then a file, then Upload — but far
 * simpler: no drag-and-drop, no camera capture, no category filter chips. None
 * of those earn their place on a page someone opens once from an SMS.
 *
 * The "already on file" list is type + date only. It comes from the server page
 * and is refreshed with `router.refresh()` after each upload, so the checklist
 * updates without navigating away.
 */
export function PublicDocumentUploadForm({
  token, displayName, requiredDocTypes, onFile,
}: {
  token: string
  displayName: string
  requiredDocTypes: string[]
  onFile: { type: DocumentType; uploaded_at: string }[]
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<DocumentType | ''>('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)

  const onFileTypes = new Set(onFile.map((d) => d.type))

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await submitPublicDocument(token, formData)
    if (!result?.error) {
      setType('')
      setFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadedCount((n) => n + 1)
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] bg-[#f7f6f4] px-5 py-5 elev">
        <p className="text-[14px] font-semibold text-[#16161a]">
          {displayName ? `Hello ${displayName},` : 'Hello,'}
        </p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#5f5d58]">
          Upload the documents below for your loan application. You can add them one at a time, and come back to
          this link while it is valid.
        </p>

        {requiredDocTypes.length > 0 && (
          <div className="mt-4 rounded-[20px] bg-[#efeeeb] p-4">
            <p className="mb-2.5 text-[12px] font-semibold text-[#16161a]">What we need</p>
            <ul className="space-y-1.5">
              {requiredDocTypes.map((t) => {
                const done = onFileTypes.has(t as DocumentType)
                return (
                  <li key={t} className="flex items-center gap-2 text-[12px]">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${done ? 'bg-[#1a7f5a] text-white' : 'text-[#c9c7c1]'}`}>
                      {done ? <Check size={10} strokeWidth={3} /> : <Circle size={10} />}
                    </span>
                    <span className={done ? 'text-[#47453f]' : 'text-[#7c7a75]'}>
                      {DOC_TYPE_LABEL[t as DocumentType] ?? t.replaceAll('_', ' ')}
                    </span>
                    {done && <span className="text-[11px] text-[#16694a]">received</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        <form action={formAction} className="mt-4 space-y-3">
          <div>
            <label htmlFor="public-doc-type" className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">
              What is this document?
            </label>
            {/* No default. A file uploaded under a guessed type is filed — and
                later extracted — as the wrong kind of document. */}
            <select
              id="public-doc-type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              required
              className="h-11 w-full rounded-lg bg-[#efeeeb] px-3 text-[13px] text-[#16161a]"
            >
              <option value="" disabled>Choose document type…</option>
              {DOC_CATEGORIES.map((cat) => (
                <optgroup key={cat.key} label={cat.label}>
                  {cat.types.map((t) => (
                    <option key={t} value={t}>{DOC_TYPE_LABEL[t]}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="public-doc-file" className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">
              Choose the file
            </label>
            <input
              id="public-doc-file"
              ref={fileInputRef}
              name="file"
              type="file"
              accept="application/pdf,image/*"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
              className="block w-full rounded-lg bg-[#efeeeb] px-3 py-2.5 text-[12.5px] text-[#16161a] file:mr-3 file:rounded-full file:border-0 file:bg-[#1a1917] file:px-3.5 file:py-1.5 file:text-[12px] file:font-semibold file:text-white"
            />
            <p className="mt-1 text-[11px] text-[#7c7a75]">PDF, JPG or PNG · up to 20 MB</p>
          </div>

          {state?.error && <p className="text-[12px] text-[#b42318]">{state.error}</p>}
          {uploadedCount > 0 && !state?.error && (
            <p className="flex items-start gap-2 rounded-[20px] bg-[#e8f3ee] px-4 py-3 text-[12.5px] font-medium leading-relaxed text-[#16694a]">
              <Check size={15} className="mt-px shrink-0" />
              Thank you — {uploadedCount === 1 ? 'your document has' : `${uploadedCount} documents have`} been received.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !type || !fileName}
            title={type ? undefined : 'Choose a document type first'}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2440e8] px-4 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            <UploadCloud size={16} />
            {pending ? 'Uploading…' : 'Upload document'}
          </button>
        </form>
      </div>

      <div className="rounded-[28px] bg-[#f7f6f4] px-5 py-4 elev">
        <p className="text-[12.5px] font-semibold text-[#16161a]">Already received</p>
        {onFile.length === 0 ? (
          <p className="mt-1.5 text-[12px] text-[#7c7a75]">Nothing yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#e7e6e2]">
            {onFile.map((d) => (
              <li key={`${d.type}-${d.uploaded_at}`} className="flex items-center justify-between gap-3 py-2">
                <span className="text-[12px] text-[#47453f]">
                  {DOC_TYPE_LABEL[d.type] ?? d.type.replaceAll('_', ' ')}
                </span>
                <span className="shrink-0 text-[11px] text-[#7c7a75] tnum">
                  {new Date(d.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
