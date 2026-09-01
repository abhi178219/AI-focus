import { PolicyWorkspace } from '@/components/shared/PolicyWorkspace'

export default async function PolicyPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = 'live' } = await searchParams
  return <PolicyWorkspace view={view} basePath="/partner/policy" />
}
