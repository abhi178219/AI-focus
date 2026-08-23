export type Role = 'dsa_partner' | 'ops_admin'

export type LeadStage =
  | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DOCUMENTATION' | 'ASSESSMENT'
  | 'LOGGED_IN' | 'SANCTIONED' | 'DISBURSED' | 'DROPPED'

export const LEAD_STAGES: LeadStage[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTATION', 'ASSESSMENT',
  'LOGGED_IN', 'SANCTIONED', 'DISBURSED', 'DROPPED',
]

export type LoanType = 'PL' | 'HL' | 'LAP' | 'BOTH'
export type ProductCategory = 'PL' | 'HL' | 'LAP'

export type DocumentType =
  | 'PAN_CARD' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT' | 'PROPERTY_DEED'
  | 'BUILDER_AGREEMENT' | 'OCCUPANCY_CERTIFICATE' | 'PROPERTY_VALUATION' | 'ITR' | 'GST_RETURNS'
  | 'CREDIT_REPORT' | 'STOCK_STATEMENT' | 'FINANCIAL_STATEMENT' | 'OTHER'

export type DocumentStatus = 'uploaded' | 'parsing' | 'verified' | 'rejected'

export type Band = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'CRITICAL'
export type Verdict = 'PASS' | 'REFER' | 'DECLINE'
export type PillarCode = 'BANKING' | 'BUREAU' | 'COLLATERAL' | 'GST'

export interface Lead {
  id: string
  agent_id: string
  client_name: string
  phone: string
  email: string | null
  pan_number: string | null
  loan_type: LoanType
  monthly_income: number | null
  existing_emis: number
  requested_amount: number
  tenure_years: number | null
  property_value: number | null
  property_stage: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | null
  property_city: string | null
  has_co_applicant: boolean
  co_applicant_income: number | null
  stage: LeadStage
  calculated_eligible_amount: number | null
  cibil_score: number | null
  bank_assigned: string | null
  disbursed_amount: number | null
  product_id: string | null
  crm_synced: boolean
  crm_synced_at: string | null
  case_narrative: string | null
  case_narrative_generated_at: string | null
  fields_from_documents: string[]
  // Applicant profile — all optional, filled in after capture.
  date_of_birth: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  marital_status: 'SINGLE' | 'MARRIED' | 'OTHER' | null
  employment_type: 'SALARIED' | 'SELF_EMPLOYED' | null
  residence_city: string | null
  // Entity profile — self-employed files.
  business_name: string | null
  business_constitution: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'LLP' | 'PUBLIC_LIMITED' | null
  business_vintage_years: number | null
  industry: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  code: string
  name: string
  category: ProductCategory
  description: string | null
  is_active: boolean
  min_interest_rate: number
  max_interest_rate: number
  min_tenure_years: number
  max_tenure_years: number
  max_foir_percent: number
  default_processing_fee_percent: number
  min_salary_required: number | null
  max_ltv_percent: number | null
  pillar_weights: Record<PillarCode, number>
  required_documents: string[]
}

/** A specific lender's offering within a product family. */
export interface LenderProduct {
  id: string
  product_id: string
  lender_name: string
  short_code: string
  display_name: string
  interest_rate: number
  max_sanction_amount: number
  min_tenure_years: number
  max_tenure_years: number
  processing_fee_percent: number
  is_active: boolean
  created_at: string
}

export interface DocumentRow {
  id: string
  lead_id: string
  type: DocumentType
  name: string
  storage_path: string
  file_mime: string | null
  status: DocumentStatus
  ocr_text: string | null
  extracted_json: Record<string, unknown> | null
  extraction_model: string | null
  extraction_pipeline_version: string | null
  extraction_confidence: number | null
  extraction_error: string | null
  uploaded_by: string | null
  uploaded_at: string
  processed_at: string | null
}

export interface AssessmentPillar {
  id: string
  assessment_id: string
  pillar_code: PillarCode
  score: number
  band: Band
  headline: string | null
  signals: string[]
}

export interface Assessment {
  id: string
  lead_id: string
  composite_score: number
  composite_band: Band
  verdict: Verdict
  knockouts: string[]
  governing_capacity: number | null
  binding_constraint: string | null
  dscr: number | null
  dscr_band: Band | null
  proposed_emi: number | null
  recommendation: string | null
  watch_items: string[]
  source_document_ids: string[]
  rules_version: string
  computed_at: string
  pillars?: AssessmentPillar[]
}

// Exact colors sampled from the reference mockup's computed styles.
export interface LenderOffer {
  id: string
  lead_id: string
  bank_name: string
  product_id: string | null
  interest_rate: number
  tenure_years: number
  processing_fee_percent: number
  approved_amount: number
  emi: number | null
  status: 'draft' | 'shared' | 'accepted' | 'rejected'
  created_at: string
}

// Five DISTINCT hues, sampled from the prototype. STRONG(emerald) and GOOD(sky)
// are different colours; MODERATE(amber) and WEAK(orange) are different colours.
export const BAND_STYLES: Record<Band, string> = {
  STRONG: 'bg-[#e8f3ee] text-[#16694a]',
  GOOD: 'bg-[#e8f0f7] text-[#1a5d95]',
  MODERATE: 'bg-[#f7f0e2] text-[#85580d]',
  WEAK: 'bg-[#f8ece5] text-[#99461a]',
  CRITICAL: 'bg-[#fbebeb] text-[#b42318]',
}

// Solid dot / progress-bar fill per band.
export const BAND_SOLID: Record<Band, string> = {
  STRONG: 'bg-[#1a7f5a]',
  GOOD: 'bg-[#1f6fb2]',
  MODERATE: 'bg-[#a06a10]',
  WEAK: 'bg-[#b8551f]',
  CRITICAL: 'bg-[#b3323f]',
}

export const BAND_LABEL: Record<Band, string> = {
  STRONG: 'Strong', GOOD: 'Good', MODERATE: 'Moderate', WEAK: 'Weak', CRITICAL: 'Critical',
}

export const VERDICT_STYLES: Record<Verdict, string> = {
  PASS: 'bg-[#e8f3ee] text-[#16694a]',
  REFER: 'bg-[#f7f0e2] text-[#85580d]',
  DECLINE: 'bg-[#fbebeb] text-[#b42318]',
}

// The prototype DOES colour-code stage pills by how far the file has travelled
// (grey → sky in-flight → emerald won → rose lost), each with a short
// descriptor underneath. Sampled from its Leads table.
/**
 * Stage pill tones, exactly the prototype's `ti[].tone`:
 * neutral → neutral, brand → the indigo accent, then the band hues.
 */
export const STAGE_PILL_STYLES: Record<LeadStage, string> = {
  NEW: 'bg-[#efeeeb] text-[#47453f]',
  CONTACTED: 'bg-[#efeeeb] text-[#47453f]',
  QUALIFIED: 'bg-[#eef1fe] text-[#2440e8]',
  DOCUMENTATION: 'bg-[#eef1fe] text-[#2440e8]',
  ASSESSMENT: 'bg-[#f7f0e2] text-[#85580d]',
  LOGGED_IN: 'bg-[#e8f0f7] text-[#1a5d95]',
  SANCTIONED: 'bg-[#e8f3ee] text-[#16694a]',
  DISBURSED: 'bg-[#e8f3ee] text-[#16694a]',
  DROPPED: 'bg-[#fbebeb] text-[#b42318]',
}

/** Neutral pill, still used for non-stage chips (channels, tags). */
export const STAGE_PILL_STYLE = 'bg-[#efeeeb] text-[#47453f]'

/**
 * Short stage labels — used in the funnel, the leads table and pills.
 * Exactly the prototype's `ti[].label` map; the longer wording in
 * STAGE_DESCRIPTIONS is the File-journey stepper's, not this.
 */
export const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  DOCUMENTATION: 'Documentation',
  ASSESSMENT: 'Assessment',
  LOGGED_IN: 'Logged in',
  SANCTIONED: 'Sanctioned',
  DISBURSED: 'Disbursed',
  DROPPED: 'Dropped / Lost',
}

/** The condensed milestone funnel on the Dashboard — six stages, as the prototype. */
export const FUNNEL_STAGES: LeadStage[] = [
  'NEW', 'QUALIFIED', 'ASSESSMENT', 'LOGGED_IN', 'SANCTIONED', 'DISBURSED',
]

/** One-line descriptor shown under the stage pill, as in the prototype. */
export const STAGE_DESCRIPTIONS: Record<LeadStage, string> = {
  NEW: 'Lead captured and assigned',
  CONTACTED: 'First conversation completed',
  QUALIFIED: 'Profile and requirement qualified',
  DOCUMENTATION: 'Documents being collected',
  ASSESSMENT: 'File with credit underwriting',
  LOGGED_IN: 'File logged with lender',
  SANCTIONED: 'Sanction terms shared',
  DISBURSED: 'Loan disbursed to customer',
  DROPPED: 'File closed without disbursal',
}
