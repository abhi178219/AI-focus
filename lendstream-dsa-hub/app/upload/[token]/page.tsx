import type { Metadata } from 'next'
import { getUploadPageData } from '@/app/actions/publicSubmissions'
import { PublicDocumentUploadForm } from '@/components/shared/PublicDocumentUploadForm'
import { InvalidLinkCard, PublicPageShell } from '@/components/shared/PublicPageShell'

/**
 * PUBLIC page — no session, no AppShell, no sidebar. The token in the URL is
 * the only input; `getUploadPageData` re-validates it (token, expiry, purpose)
 * and scopes everything it returns to the lead that token names. A bad token
 * gets the one flat dead-end card.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Upload your documents — LendStream',
  robots: { index: false, follow: false },
}

export default async function PublicUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getUploadPageData(token)

  if (!data.ok) return <InvalidLinkCard />

  return (
    <PublicPageShell
      title="Upload your documents"
      sub="Add the documents your relationship manager needs for your loan application."
    >
      <PublicDocumentUploadForm
        token={token}
        displayName={data.displayName}
        requiredDocTypes={data.requiredDocTypes}
        onFile={data.onFile}
      />
    </PublicPageShell>
  )
}
