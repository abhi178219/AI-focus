import { LeadDetail } from '@/components/shared/LeadDetail'

export default async function PartnerLeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ leadId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { leadId } = await params
  const { tab = 'overview' } = await searchParams
  return <LeadDetail leadId={leadId} basePath="/partner/leads" tab={tab} />
}
