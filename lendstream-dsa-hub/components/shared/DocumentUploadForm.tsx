'use client'

import { useActionState, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Camera, X } from 'lucide-react'
import { uploadDocument } from '@/app/actions/documents'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import type { DocumentType } from '@/lib/types'
import { DOC_CATEGORIES, DOC_TYPE_LABEL } from '@/lib/documentCategories'

type State = { error?: string; documentId?: string }

/**
 * "Add documents" card — the prototype's upload panel: a category selector in
 * the header, a full-width drag-and-drop zone with an upload button and a
 * camera-capture button, and the scan-quality note underneath.
 */
export function DocumentUploadForm({ leadId }: { leadId: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [source, setSource] = useState<'UPLOAD' | 'SCAN'>('UPLOAD')
  // No default document type. Silently defaulting to one (this used to default
  // to PAN_CARD) meant a bank statement dropped without the dropdown being
  // touched was uploaded — and then extracted — as a PAN card. Forcing an
  // explicit choice is the fix; see the "Untitled" placeholder option below.
  const [type, setType] = useState<DocumentType | ''>('')
  const [dragActive, setDragActive] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await uploadDocument(leadId, formData)
    if (!result?.error) {
      clearFile()
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  function clearFile() {
    setFileName(null)
    setFileSize(null)
    setSource('UPLOAD')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleFiles(files: FileList | null, from: 'UPLOAD' | 'SCAN') {
    const file = files?.[0]
    if (!file) return
    setFileName(file.name)
    setFileSize(file.size)
    setSource(from)
    if (fileInputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileInputRef.current.files = dt.files
    }
  }

  return (
    <Card>
      <CardHead
        title="Add documents"
        sub="Upload from this device, or scan with the camera"
        icon={<UploadCloud size={16} />}
        right={
          <select
            name="type"
            form="document-upload-form"
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            required
            aria-label="Document type"
            className={`h-9 max-w-[220px] rounded-full px-4 text-[12px] font-medium ${
              type ? 'bg-[#efeeeb] text-[#47453f]' : 'bg-[#fbebeb] text-[#b42318]'
            }`}
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
        }
      />
      <CardBody>
        <form id="document-upload-form" action={formAction}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files, 'UPLOAD') }}
            className={`rounded-[20px] border-2 border-dashed px-6 py-8 text-center transition-colors ${
              dragActive ? 'border-[#2440e8] bg-[#eef1fe]' : 'border-[#dcdbd6] bg-[#efeeeb]/60'
            }`}
          >
            <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-[20px] bg-[#f7f6f4] text-[#5f5d58]">
              <UploadCloud size={20} />
            </span>
            <p className="text-[13px] font-semibold text-[#47453f]">Drop files here, or choose how to add them</p>
            <p className="mt-1 text-[11px] text-[#7c7a75]">PDF, JPG or PNG · password-protected PDFs supported</p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white hover:opacity-90"
              >
                <UploadCloud size={16} /> Upload files
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#efeeeb] px-4 text-[13px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
              >
                <Camera size={16} /> Scan with camera
              </button>
            </div>

            {fileName && (
              <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-[#f7f6f4] py-1.5 pl-4 pr-1.5">
                <span className="text-[12px] font-medium text-[#16161a]">{fileName}</span>
                <span className="text-[11px] text-[#7c7a75] tnum">
                  {fileSize != null ? formatSize(fileSize) : ''} · {source === 'SCAN' ? 'scanned' : 'selected'}
                </span>
                {/* Names the type this file will actually be filed and extracted as,
                    so a mismatch between the file and the dropdown is obvious
                    before Upload is pressed, not after extraction runs. */}
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${type ? 'bg-[#eef1fe] text-[#2440e8]' : 'bg-[#fbebeb] text-[#b42318]'}`}>
                  {type ? DOC_TYPE_LABEL[type] : 'Choose a document type above'}
                </span>
                <button type="button" onClick={clearFile} aria-label="Remove selected file" className="grid h-6 w-6 place-items-center rounded-full text-[#7c7a75] hover:bg-[#e3e2de]">
                  <X size={12} />
                </button>
                <button
                  type="submit"
                  disabled={pending || !type}
                  title={type ? undefined : 'Choose a document type first'}
                  className="h-8 rounded-full bg-[#1a1917] px-3.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              name="file"
              type="file"
              accept="application/pdf,image/*"
              required
              className="hidden"
              onChange={(e) => handleFiles(e.target.files, 'UPLOAD')}
            />
          </div>
        </form>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files, 'SCAN'); e.target.value = '' }}
        />

        {state?.error && <p className="mt-3 text-[12px] text-[#b42318]">{state.error}</p>}

        <p className="mt-3 rounded-[20px] bg-[#efeeeb] px-4 py-3 text-[12px] leading-relaxed text-[#47453f]">
          Scanned pages are checked for blur, glare and cropping before extraction runs. Anything unreadable is
          flagged immediately rather than failing later in the file.
        </p>
      </CardBody>
    </Card>
  )
}

function formatSize(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
