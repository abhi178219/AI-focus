'use client'

import { useState, useTransition } from 'react'
import { Link2, UploadCloud } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { createConsentLink, createDocumentUploadLink } from '@/app/actions/customerLinks'
import type { CustomerLinkPurpose } from '@/lib/types'

/**
 * "Generate a link to send the customer" — used by the consent sidebar card on
 * the Activity tab and by the Documents tab's own small card.
 *
 * The generated URL is shown in a plain read-only input the user selects and
 * copies. No clipboard API, no toast: this is a link an agent pastes into
 * WhatsApp, and a field they can see the whole of is more trustworthy than a
 * button that claims to have copied something.
 *
 * `window.location.origin` is read here, in the browser, because a server
 * action has no access to the request host. It only shapes the string handed
 * back to this same agent — the action still derives the lead, the applicant
 * and the token entirely server-side.
 */
export function CustomerLinkPanel({
  leadId, purpose, buttonLabel,
}: {
  leadId: string
  purpose: CustomerLinkPurpose
  buttonLabel: string
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function generate() {
    setError(null)
    const origin = window.location.origin
    startTransition(async () => {
      const result = purpose === 'CONSENT'
        ? await createConsentLink(leadId, origin)
        : await createDocumentUploadLink(leadId, origin)
      if (result?.error) { setError(result.error); setUrl(null); return }
      setUrl(result.url ?? null)
    })
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={generate}
        disabled={pending}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1a1917] px-3.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        <Link2 size={14} /> {pending ? 'Creating…' : url ? 'Create a new link' : buttonLabel}
      </button>

      {error && <p className="text-[12px] text-[#b42318]">{error}</p>}

      {url && (
        <div>
          <label className="mb-1 block text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">
            Send this link to the customer
          </label>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            className="h-9 w-full rounded-lg bg-[#efeeeb] px-3 text-[12px] text-[#16161a]"
          />
          <p className="mt-1 text-[11px] leading-snug text-[#7c7a75]">
            Works for 7 days, for anyone who has it — send it only to the customer. Creating a new link does not
            stop this one working.
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Documents tab: a small card above the uploader, so collecting documents from
 * the customer sits right next to uploading them yourself.
 */
export function UploadLinkCard({ leadId, isOwn }: { leadId: string; isOwn: boolean }) {
  if (!isOwn) return null
  return (
    <Card>
      <CardHead
        title="Ask the customer for documents"
        sub="Send a link they can upload from — no account needed"
        icon={<UploadCloud size={16} />}
      />
      <CardBody>
        <CustomerLinkPanel leadId={leadId} purpose="DOCUMENT_UPLOAD" buttonLabel="Send upload link" />
      </CardBody>
    </Card>
  )
}
