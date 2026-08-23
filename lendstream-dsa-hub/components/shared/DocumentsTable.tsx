'use client'

import { useState } from 'react'
import { FileText, Check, Circle } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { BandBar } from '@/components/ui/BandPill'
import { ApplyFieldsButton } from '@/components/shared/ApplyFieldsButton'
import { RunAssessmentButton } from '@/components/shared/RunAssessmentButton'
import type { DocumentRow, DocumentType } from '@/lib/types'
import { DOC_CATEGORIES, DOC_TYPE_LABEL, categoryOf } from '@/lib/documentCategories'

const STATUS_STYLE: Record<DocumentRow['status'], string> = {
  verified: 'bg-[#e8f3ee] text-[#16694a]',
  rejected: 'bg-[#fbebeb] text-[#b42318]',
  parsing: 'bg-[#f7f0e2] text-[#85580d]',
  uploaded: 'bg-[#efeeeb] text-[#47453f]',
}

/**
 * "Document checklist" card — the prototype's collection panel: an
 * "N of M verified" sub-heading with a progress bar, category chips, and one
 * row per uploaded file. The required-document strip underneath comes from the
 * product catalogue's `required_documents`, so it only lists what this product
 * genuinely asks for.
 */
export function DocumentsTable({
  documents, requiredDocTypes = [], loanType,
}: {
  documents: DocumentRow[]
  requiredDocTypes?: string[]
  loanType?: string
}) {
  const [filter, setFilter] = useState<string>('ALL')

  const countsByCategory = new Map<string, number>()
  for (const d of documents) countsByCategory.set(categoryOf(d.type), (countsByCategory.get(categoryOf(d.type)) ?? 0) + 1)

  const rows = filter === 'ALL' ? documents : documents.filter((d) => categoryOf(d.type) === filter)
  const verified = documents.filter((d) => d.status === 'verified').length
  const total = documents.length
  const progress = total ? (verified / total) * 100 : 0

  const verifiedTypes = new Set(documents.filter((d) => d.status === 'verified').map((d) => d.type))
  const requiredVerified = requiredDocTypes.filter((t) => verifiedTypes.has(t as DocumentType)).length

  return (
    <Card>
      <CardHead
        title="Document checklist"
        sub={`${verified} of ${total} verified`}
        icon={<FileText size={16} />}
        right={
          <BandBar
            value={progress}
            band={total > 0 && verified === total ? 'STRONG' : 'MODERATE'}
            className="h-2 w-28"
          />
        }
      />

      {total === 0 ? (
        <CardBody>
          <div className="grid place-items-center rounded-[20px] bg-[#efeeeb] px-6 py-10 text-center">
            <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-[#f7f6f4] text-[#7c7a75]">
              <FileText size={18} />
            </span>
            <p className="text-[13px] font-semibold text-[#16161a]">No documents yet</p>
            <p className="mt-1 text-[11px] text-[#7c7a75]">Upload or scan to begin collection.</p>
          </div>
        </CardBody>
      ) : (
        <>
          <CardBody className="pb-3">
            <div className="flex flex-wrap gap-1.5">
              <Chip active={filter === 'ALL'} onClick={() => setFilter('ALL')} label={`All (${total})`} />
              {DOC_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.key}
                  active={filter === cat.key}
                  onClick={() => setFilter(cat.key)}
                  label={`${cat.label} (${countsByCategory.get(cat.key) ?? 0})`}
                />
              ))}
            </div>
          </CardBody>

          <div className="divide-y divide-[#e7e6e2]">
            {rows.length === 0 && (
              <p className="px-5 py-8 text-center text-[12px] text-[#a8a6a0]">No documents in this category.</p>
            )}
            {rows.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#efeeeb] text-[#5f5d58]">
                  <FileText size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-[#16161a]">{doc.name}</p>
                  <p className="text-[11px] text-[#7c7a75] tnum">
                    {DOC_TYPE_LABEL[doc.type] ?? doc.type.replaceAll('_', ' ')} · {new Date(doc.uploaded_at).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[doc.status]}`}>
                  {doc.status}
                </span>
                <div className="shrink-0">
                  {doc.status === 'verified'
                    ? <ApplyFieldsButton documentId={doc.id} />
                    : <RunAssessmentButton kind="document" id={doc.id} disabled={doc.status !== 'uploaded'} />}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {requiredDocTypes.length > 0 && (
        <CardBody className="pt-4">
          <div className="rounded-[20px] bg-[#efeeeb] p-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-[12px] font-semibold text-[#16161a]">
                Required for {loanType ?? 'this product'}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                requiredVerified === requiredDocTypes.length ? 'bg-[#e8f3ee] text-[#16694a]' : 'bg-[#f7f0e2] text-[#85580d]'
              }`}>
                {requiredVerified} of {requiredDocTypes.length} verified
              </span>
            </div>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {requiredDocTypes.map((t) => {
                const done = verifiedTypes.has(t as DocumentType)
                return (
                  <li key={t} className="flex items-center gap-2 text-[11.5px]">
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${done ? 'bg-[#1a7f5a] text-white' : 'text-[#c9c7c1]'}`}>
                      {done ? <Check size={10} strokeWidth={3} /> : <Circle size={10} />}
                    </span>
                    <span className={done ? 'text-[#47453f]' : 'text-[#7c7a75]'}>
                      {DOC_TYPE_LABEL[t as DocumentType] ?? t.replaceAll('_', ' ')}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </CardBody>
      )}
    </Card>
  )
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
        active ? 'bg-[#1a1917] text-white' : 'bg-[#efeeeb] text-[#5f5d58] hover:bg-[#e3e2de]'
      }`}
    >
      {label}
    </button>
  )
}
