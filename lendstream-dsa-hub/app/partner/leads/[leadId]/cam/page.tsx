import { CamDocument } from '@/components/shared/CamDocument'

export default async function PartnerCamPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params
  return <CamDocument leadId={leadId} basePath="/partner/leads" />
}
