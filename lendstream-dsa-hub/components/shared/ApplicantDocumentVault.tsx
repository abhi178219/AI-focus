'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderLock, FileText, Paperclip } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { uploadApplicantDocument } from '@/app/actions/applicantRelationship'
import { APPLICANT_DOC_TYPES, APPLICANT_DOC_TYPE_LABEL, type ApplicantDocument, type ApplicantDocumentType } from '@/lib/types'

type State = { error?: string; documentId?: string }

/**
 * The applicant's own document vault — identity and entity papers that belong
 * to the person across every application.
 *
 * Deliberately much simpler than `DocumentUploadForm` (the lead-scoped one): no
 * drag-and-drop, no camera capture, no category grouping and no extraction
 * pipeline. These files are stored and listed, never parsed, so none of that
 * machinery would mean anything here.
 */
export function ApplicantDocumentVault({
  applicantId, documents, isOwn,
}: {
  applicantId: string
  documents: ApplicantDocument[]
  isOwn: boolean
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  // No default type. Silently filing a document as the wrong kind is the exact
  // failure the lead-side uploader had to be fixed for.
  const [type, setType] = useState<ApplicantDocumentType | ''>('')
  const [fileName, setFileName] = useState<string | null>(null)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await uploadApplicantDocument(applicantId, formData)
    if (!result?.error) {
      setType('')
      setFileName(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <Card>
      <CardHead
        title="Document vault"
        sub="Identity and entity papers held against the applicant, not any one application"
        icon={<FolderLock size={16} />}
      />
      <CardBody className="space-y-3">
        {isOwn && (
          <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-[20px] bg-[#efeeeb]/60 p-3.5">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">Document type</label>
              <select
                name="type"
                required
                value={type}
                onChange={(e) => setType(e.target.value as ApplicantDocumentType)}
                className={`h-9 w-full rounded-lg px-3 text-[13px] ${type ? 'bg-[#efeeeb] text-[#16161a]' : 'bg-[#fbebeb] text-[#b42318]'}`}
              >
                <option value="" disabled>Choose document type…</option>
                {APPLICANT_DOC_TYPES.map((t) => <option key={t} value={t}>{APPLICANT_DOC_TYPE_LABEL[t]}</option>)}
              </select>
            </div>
            <div className="min-w-[180px] flex-[2]">
              <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">File</label>
              <input
                ref={fileInputRef}
                name="file"
                type="file"
                accept="application/pdf,image/*"
                required
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                className="h-9 w-full rounded-lg bg-[#efeeeb] px-3 py-1.5 text-[12px] text-[#5f5d58] file:mr-2 file:rounded-full file:border-0 file:bg-[#e3e2de] file:px-3 file:py-1 file:text-[11.5px] file:font-semibold file:text-[#47453f]"
              />
            </div>
            <button
              type="submit"
              disabled={pending || !type || !fileName}
              title={type ? undefined : 'Choose a document type first'}
              className="h-9 shrink-0 rounded-full bg-[#1a1917] px-4 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {pending ? 'Uploading…' : 'Upload'}
            </button>
            {state?.error && <p className="w-full text-[12px] text-[#b42318]">{state.error}</p>}
          </form>
        )}

        {documents.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-[#a8a6a0]">Nothing on file yet.</p>
        ) : (
          <div className="divide-y divide-[#e7e6e2]">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#efeeeb] text-[#5f5d58]">
                  <FileText size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-[#16161a]">{APPLICANT_DOC_TYPE_LABEL[d.type]}</p>
                  <p className="flex items-center gap-1 truncate text-[11px] text-[#7c7a75]">
                    <Paperclip size={10} className="shrink-0" /> {d.name}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-[#7c7a75] tnum">
                  {new Date(d.uploaded_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
