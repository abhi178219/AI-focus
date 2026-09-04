import type { Metadata } from 'next'
import { getConsentPageData } from '@/app/actions/publicSubmissions'
import { PublicConsentForm } from '@/components/shared/PublicConsentForm'
import { InvalidLinkCard, PublicPageShell } from '@/components/shared/PublicPageShell'

/**
 * PUBLIC page — no session, no AppShell, no sidebar. Reachable by anyone
 * holding the token (see lib/supabase/middleware.ts: only /partner/* is
 * auth-gated, by design).
 *
 * The token in the URL is the only input, and `getConsentPageData` re-validates
 * it — token, expiry and purpose — before returning anything. A bad token gets
 * the one flat dead-end card, never a partial page and never a hint.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your consent — LendStream',
  // Nothing here should ever be indexed or previewed by a crawler that happens
  // to be handed the link.
  robots: { index: false, follow: false },
}

export default async function PublicConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await getConsentPageData(token)

  if (!data.ok) return <InvalidLinkCard />

  return (
    <PublicPageShell
      title="Your consent"
      sub="Three quick questions about how we may use your information for your loan application."
    >
      <PublicConsentForm token={token} displayName={data.displayName} latestByType={data.latestByType} />
    </PublicPageShell>
  )
}
