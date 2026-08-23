import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LeadHeader } from '@/components/shared/LeadHeader'
import { LeadOverview } from '@/components/shared/LeadOverview'
import { SectionPanel } from '@/components/shared/SectionPanel'
import { DocumentUploadForm } from '@/components/shared/DocumentUploadForm'
import { DocumentsTable } from '@/components/shared/DocumentsTable'
import { ActivityPanel, type ActivityRow } from '@/components/shared/ActivityPanel'
import { DecisionPanel } from '@/components/shared/DecisionPanel'
import { OffersPanel } from '@/components/shared/OffersPanel'
import { ApplicantPanel } from '@/components/shared/ApplicantPanel'
import { buildSections, buildSignals, type SectionCode } from '@/lib/decision/sections'
import {
  type Lead, type DocumentRow, type Assessment, type AssessmentPillar,
  type LenderOffer, type LenderProduct, type Product, type Band,
} from '@/lib/types'

/** Tab order matches the prototype exactly. */
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'banking', label: 'Banking' },
  { key: 'gst', label: 'GST' },
  { key: 'bureau', label: 'Bureau' },
  { key: 'financials', label: 'Financials' },
  { key: 'business', label: 'Business' },
  { key: 'stock', label: 'Stock' },
  { key: 'collateral', label: 'Collateral' },
  { key: 'decision', label: 'Decision' },
  { key: 'offers', label: 'Offers' },
  { key: 'documents', label: 'Documents' },
  { key: 'activity', label: 'Activity' },
] as const

const SECTION_TABS: Record<string, SectionCode> = {
  banking: 'BANKING', gst: 'GST', bureau: 'BUREAU', financials: 'FINANCIALS',
  business: 'BUSINESS', stock: 'STOCK', collateral: 'COLLATERAL',
}

export async function LeadDetail({ leadId, basePath, tab }: { leadId: string; basePath: string; tab: string }) {
  const activeTab = TABS.some((t) => t.key === tab) ? tab : 'overview'

  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single<Lead>()
  if (!lead) notFound()

  const productCategories = lead.loan_type === 'BOTH' ? ['PL', 'HL'] : [lead.loan_type]

  const [{ data: documents }, { data: assessment }, { data: interactions }, { data: offers }, { data: catalogueProducts }, { data: rankProduct }] = await Promise.all([
    supabase.from('documents').select('*').eq('lead_id', leadId).order('uploaded_at', { ascending: false }).returns<DocumentRow[]>(),
    supabase.from('assessments').select('*, assessment_pillars(*)').eq('lead_id', leadId).order('computed_at', { ascending: false }).limit(1).maybeSingle<Assessment & { assessment_pillars: AssessmentPillar[] }>(),
    supabase.from('interactions').select('*').eq('lead_id', leadId).order('occurred_at', { ascending: false }),
    supabase.from('lender_offers').select('*').eq('lead_id', leadId).order('created_at', { ascending: false }).returns<LenderOffer[]>(),
    supabase.from('products').select('id, required_documents').in('category', productCategories),
    supabase.from('products').select('*').eq('category', productCategories[0]).eq('is_active', true).order('min_interest_rate').limit(1).maybeSingle<Product>(),
  ])

  const docs = documents ?? []
  const pillars = assessment?.assessment_pillars ?? []
  const sections = buildSections(lead, docs)
  const signals = buildSignals(sections, lead)

  const requiredDocTypes = [...new Set((catalogueProducts ?? []).flatMap((p) => p.required_documents ?? []))]

  // The Offers tab quotes from the real lender catalogue for this lead's
  // product family. Activity needs the display name of whoever logged each
  // interaction — profiles are read separately because RLS scopes them.
  const catalogueProductIds = (catalogueProducts ?? []).map((p) => p.id as string)
  const interactionRows = (interactions ?? []) as {
    id: string; channel: string; outcome: string | null; note: string | null
    occurred_at: string; next_follow_up: string | null; agent_id: string
  }[]
  const actorIds = [...new Set([...interactionRows.map((i) => i.agent_id), lead.agent_id])].filter(Boolean)

  const [{ data: lenderProductRows }, { data: actorProfiles }] = await Promise.all([
    catalogueProductIds.length
      ? supabase.from('lender_products').select('*').in('product_id', catalogueProductIds).eq('is_active', true).order('interest_rate').returns<LenderProduct[]>()
      : Promise.resolve({ data: [] as LenderProduct[] }),
    actorIds.length
      ? supabase.from('profiles').select('id, full_name').in('id', actorIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
  ])

  const nameById = new Map((actorProfiles ?? []).map((p) => [p.id, p.full_name]))
  const activityRows: ActivityRow[] = interactionRows.map((i) => ({
    id: i.id,
    channel: i.channel,
    outcome: i.outcome,
    note: i.note,
    occurred_at: i.occurred_at,
    next_follow_up: i.next_follow_up,
    by: nameById.get(i.agent_id) ?? null,
  }))

  // Tab dots mirror the prototype: a pillar's band shows as a coloured dot on its tab.
  const bandByTab: Record<string, Band | null> = {}
  for (const [tabKey, code] of Object.entries(SECTION_TABS)) {
    bandByTab[tabKey] = sections.find((s) => s.key === code)?.band ?? null
  }
  const BAND_DOT: Record<Band, string> = {
    STRONG: 'bg-[#1a7f5a]', GOOD: 'bg-[#1f6fb2]', MODERATE: 'bg-[#a06a10]',
    WEAK: 'bg-[#b8551f]', CRITICAL: 'bg-[#b3323f]',
  }

  return (
    <div className="pt-6">
      <Link href={basePath} className="mb-3 inline-flex items-center gap-1 text-[12px] text-[#7c7a75] hover:text-[#16161a]">
        ← All leads
      </Link>

      <LeadHeader lead={lead} leadId={leadId} basePath={basePath} assessment={assessment} />

      <nav className="mb-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => {
          const band = bandByTab[t.key]
          return (
            <Link
              key={t.key}
              href={`${basePath}/${leadId}?tab=${t.key}`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                activeTab === t.key ? 'bg-[#1a1917] text-white' : 'bg-[#f7f6f4] text-[#5f5d58] hover:bg-[#efeeeb]'
              }`}
            >
              {t.label}
              {band && <span className={`h-1.5 w-1.5 rounded-full ${BAND_DOT[band]}`} />}
            </Link>
          )
        })}
      </nav>

      {activeTab === 'overview' && (
        <LeadOverview
          lead={lead} leadId={leadId} basePath={basePath}
          assessment={assessment} pillars={pillars}
          sections={sections} signals={signals} documents={docs}
        />
      )}

      {activeTab === 'applicant' && <ApplicantPanel leadId={leadId} lead={lead} />}

      {SECTION_TABS[activeTab] && (
        <SectionPanel
          section={sections.find((s) => s.key === SECTION_TABS[activeTab])!}
          basePath={basePath}
          leadId={leadId}
        />
      )}

      {activeTab === 'decision' && (
        <DecisionPanel
          leadId={leadId}
          lead={lead}
          assessment={assessment}
          pillars={pillars}
          product={rankProduct}
          lenderProducts={lenderProductRows ?? []}
          documents={docs}
        />
      )}

      {activeTab === 'offers' && (
        <OffersPanel
          leadId={leadId}
          offers={offers ?? []}
          lenderProducts={lenderProductRows ?? []}
          requestedAmount={Number(lead.requested_amount)}
          tenureYears={lead.tenure_years ?? rankProduct?.min_tenure_years ?? 5}
          assessedCapacity={assessment?.governing_capacity != null ? Number(assessment.governing_capacity) : null}
        />
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <DocumentUploadForm leadId={leadId} />
          <DocumentsTable documents={docs} requiredDocTypes={requiredDocTypes} loanType={lead.loan_type} />
        </div>
      )}

      {activeTab === 'activity' && (
        <ActivityPanel
          leadId={leadId}
          lead={lead}
          interactions={activityRows}
          ownerName={nameById.get(lead.agent_id) ?? null}
        />
      )}
    </div>
  )
}
