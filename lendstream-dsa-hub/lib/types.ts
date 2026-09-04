export type Role = 'dsa_partner' | 'ops_admin'

export type LeadStage =
  | 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DOCUMENTATION' | 'ASSESSMENT'
  | 'LOGGED_IN' | 'SANCTIONED' | 'DISBURSED' | 'DROPPED'

export const LEAD_STAGES: LeadStage[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTATION', 'ASSESSMENT',
  'LOGGED_IN', 'SANCTIONED', 'DISBURSED', 'DROPPED',
]

export type LoanType = 'PL' | 'HL' | 'LAP' | 'BOTH' | 'BL' | 'WC'
export type ProductCategory = 'PL' | 'HL' | 'LAP'

/** Long-form product names, used wherever a raw loan_type code would be opaque. */
export const LOAN_TYPE_LABEL: Record<string, string> = {
  PL: 'Personal Loan', HL: 'Home Loan', LAP: 'Loan Against Property', BOTH: 'PL + HL', BL: 'Business Loan', WC: 'Working Capital',
}

export type DocumentType =
  | 'PAN_CARD' | 'AADHAAR' | 'SALARY_SLIP' | 'BANK_STATEMENT' | 'PROPERTY_DEED'
  | 'BUILDER_AGREEMENT' | 'OCCUPANCY_CERTIFICATE' | 'PROPERTY_VALUATION' | 'ITR' | 'GST_RETURNS'
  | 'CREDIT_REPORT' | 'STOCK_STATEMENT' | 'FINANCIAL_STATEMENT' | 'OTHER'

export type DocumentStatus = 'uploaded' | 'parsing' | 'verified' | 'rejected'

export type Band = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'CRITICAL'
export type Verdict = 'PASS' | 'REFER' | 'DECLINE'
export type PillarCode = 'BANKING' | 'BUREAU' | 'COLLATERAL' | 'GST'

export type ApplicantEntityType = 'INDIVIDUAL' | 'COMPANY'

/** Where this relationship originated. Attribution lives on the Applicant, not
 *  on any one application — the channel that brought the person in doesn't
 *  change when they come back for a second loan. */
export type LeadSourceChannel = 'ONDC' | 'REFERRAL_PARTNER' | 'ORGANIC' | 'CAMPAIGN'

export const LEAD_SOURCE_LABEL: Record<LeadSourceChannel, string> = {
  ONDC: 'ONDC',
  REFERRAL_PARTNER: 'Referral partner',
  ORGANIC: 'Organic',
  CAMPAIGN: 'Campaign',
}

export const LEAD_SOURCE_CHANNELS: LeadSourceChannel[] = ['ONDC', 'REFERRAL_PARTNER', 'ORGANIC', 'CAMPAIGN']

export interface Applicant {
  id: string
  agent_id: string
  /** Holds the company name when entity_type is COMPANY. */
  client_name: string
  phone: string
  email: string | null
  residence_address: string | null
  pincode: string | null
  /** Identity attribute of the person, not any one loan — see
   *  /decisions/2026-08-31-lendstream-dsa-hub-applicant-application-relation.md. */
  pan_number: string | null
  entity_type: ApplicantEntityType
  /** Attribution — how this relationship was sourced. Null until captured. */
  lead_source_channel: LeadSourceChannel | null
  /** Free text: which partner/DSA/agency referred them. Null unless relevant. */
  referring_partner: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Applicant relationship layer — everything below is applicant_id-scoped and
// deliberately separate from the lead_id-scoped documents/interactions tables.
// See migration 030_applicant_relationship.sql.
// ---------------------------------------------------------------------------

export type ConsentType = 'BUREAU_PULL' | 'LENDER_DATA_SHARING' | 'MARKETING'

export const CONSENT_TYPE_LABEL: Record<ConsentType, string> = {
  BUREAU_PULL: 'Bureau pull',
  LENDER_DATA_SHARING: 'Lender panel data sharing',
  MARKETING: 'Marketing communication',
}

export const CONSENT_TYPES: ConsentType[] = ['BUREAU_PULL', 'LENDER_DATA_SHARING', 'MARKETING']

/**
 * One consent capture. Append-only: a fresh row supersedes the prior one for
 * that (applicant, consent_type) purely by having a later `captured_at`, so the
 * full history of what was agreed, when, and over which channel survives.
 */
export interface ApplicantConsent {
  id: string
  applicant_id: string
  consent_type: ConsentType
  granted: boolean
  /** How it was captured — App, SMS, Email, WhatsApp, Physical form. */
  channel: string | null
  captured_at: string
  captured_by: string
}

export type ApplicantDocumentType = 'PAN_CARD' | 'AADHAAR' | 'ENTITY_KYC' | 'MOA_AOA' | 'OTHER'

export const APPLICANT_DOC_TYPE_LABEL: Record<ApplicantDocumentType, string> = {
  PAN_CARD: 'PAN Card',
  AADHAAR: 'Aadhaar Card',
  ENTITY_KYC: 'Entity KYC',
  MOA_AOA: 'MOA / AOA',
  OTHER: 'Other',
}

export const APPLICANT_DOC_TYPES: ApplicantDocumentType[] = ['PAN_CARD', 'AADHAAR', 'ENTITY_KYC', 'MOA_AOA', 'OTHER']

/**
 * A document in the applicant's own vault. Unlike `DocumentRow` (lead-scoped),
 * these are stored and listed only — no OCR, no extraction, no status flow.
 */
export interface ApplicantDocument {
  id: string
  applicant_id: string
  type: ApplicantDocumentType
  name: string
  storage_path: string
  file_mime: string | null
  uploaded_by: string | null
  uploaded_at: string
}

export type ApplicantInteractionChannel =
  | 'CALL' | 'WHATSAPP' | 'EMAIL' | 'FIELD_VISIT' | 'BRANCH_MEETING' | 'MEETING'

/**
 * A relationship-level touchpoint — with the person, not about one loan file.
 * Carries no Customer/Internal/Bank category: that split belongs to the
 * per-application Activity tab, where "which file is this about" is the point.
 */
export interface ApplicantInteraction {
  id: string
  applicant_id: string
  agent_id: string
  channel: ApplicantInteractionChannel
  note: string | null
  occurred_at: string
  next_follow_up: string | null
}

// ---------------------------------------------------------------------------
// Customer-facing links — the app's only public, unauthenticated write path.
// See migration 031_customer_links.sql and app/actions/publicSubmissions.ts.
// ---------------------------------------------------------------------------

export type CustomerLinkPurpose = 'CONSENT' | 'DOCUMENT_UPLOAD'

export const CUSTOMER_LINK_PURPOSE_LABEL: Record<CustomerLinkPurpose, string> = {
  CONSENT: 'Consent',
  DOCUMENT_UPLOAD: 'Document upload',
}

/** The `channel` stamped on a consent captured through a public link, so it is
 *  visibly distinct from one an agent recorded by hand in the Consent Centre. */
export const CONSENT_LINK_CHANNEL = 'Consent link'

/**
 * One capability handed to one customer for one lead, for a fixed window.
 *
 * `token` is a BEARER CAPABILITY, not an identifier: holding it is the entire
 * authorisation, so it is the only thing a public request may name. Everything
 * a public action then reads or writes is scoped to the `lead_id`/
 * `applicant_id` recorded HERE — never to an id the request supplied itself.
 * There is no RLS policy granting anon any access to this table; the public
 * pages reach it only through the service-role client inside the
 * token-revalidating actions in app/actions/publicSubmissions.ts.
 */
export interface CustomerLink {
  id: string
  token: string
  purpose: CustomerLinkPurpose
  lead_id: string
  applicant_id: string
  /** The agent who generated and sent the link — the accountable party, and
   *  the `captured_by` stamped on any consent recorded through it. */
  created_by: string
  expires_at: string
  created_at: string
}

/**
 * Everything the PUBLIC consent page is allowed to know. Deliberately narrow:
 * a display name and the three consent types' current state — nothing else
 * about the applicant, nothing at all about the lead, and no ids. An invalid or
 * expired token yields `{ ok: false }` and no explanation of which it was.
 */
export type PublicConsentPageData =
  | { ok: false }
  | {
      ok: true
      displayName: string
      latestByType: Partial<Record<ConsentType, { granted: boolean; captured_at: string }>>
    }

/**
 * Everything the PUBLIC upload page is allowed to know: a display name, what
 * this product requires, and a bare list of what is already on file — type and
 * date only, never a file name, never a stored path, never anything from
 * another lead or applicant.
 */
export type PublicUploadPageData =
  | { ok: false }
  | {
      ok: true
      displayName: string
      requiredDocTypes: string[]
      onFile: { type: DocumentType; uploaded_at: string }[]
    }

/**
 * Company/Contact association — HubSpot style (see
 * /decisions/2026-08-31-lendstream-dsa-hub-company-key-personnel.md). A key
 * person IS a full individual Applicant of their own (`linked_applicant_id`);
 * this row only carries the association and their role at the company.
 */
export interface KeyPersonnel {
  id: string
  company_applicant_id: string
  linked_applicant_id: string
  designation: string | null
  created_at: string
}

export interface Lead {
  id: string
  agent_id: string
  applicant_id: string
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
  // Applicant detail — captured by the user when a document didn't yield it.
  father_name: string | null
  qualification: string | null
  /** Last four digits only. The full Aadhaar number is never stored. */
  aadhaar_last4: string | null
  residence_address: string | null
  permanent_same_as_current: boolean
  permanent_address: string | null
  residence_type: 'OWNED' | 'RENTED' | 'COMPANY_PROVIDED' | 'PARENTAL' | 'LEASED' | null
  years_at_residence: number | null
  // Entity registration
  incorporation_date: string | null
  company_pan: string | null
  gstin: string | null
  udyam_number: string | null
  cin: string | null
  // Role & premises
  designation: string | null
  din: string | null
  office_address: string | null
  business_premises_ownership: 'OWNED' | 'RENTED' | 'LEASED' | null
  business_years_at_premises: number | null
  // Co-applicant
  co_applicant_name: string | null
  co_applicant_relationship: string | null
  co_applicant_dob: string | null
  co_applicant_pan: string | null
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
  /** Indicative lender turnaround, in days. Null when not configured. */
  turnaround_days: number | null
  /** Free-text credit-box note shown against the offer, e.g. security preference. */
  credit_box_note: string | null
  /** This lender's own document requirements — on top of, not instead of,
   *  the product family's baseline `products.required_documents`. */
  required_documents: DocumentType[]
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

/** One section's AI-generated summary — see leads.case_narrative for the
 *  single-lead precedent this generalises to one row per (lead, section). */
export interface SectionSummary {
  id: string
  lead_id: string
  section_code: string
  summary: string
  model: string | null
  generated_at: string
}

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type TaskStatus = 'PENDING' | 'COMPLETED'

/** A follow-up or to-do. Either or both of applicant_id/lead_id may be set —
 *  a task can be about a person generally, about one specific application,
 *  or (rarely) neither. */
export interface Task {
  id: string
  agent_id: string
  applicant_id: string | null
  lead_id: string | null
  title: string
  notes: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Credit policy
// ---------------------------------------------------------------------------

/** The five real loan products. Excludes `BOTH`, which is a lead's request
 *  shape rather than a product a policy can be written against. */
export type PolicyProduct = 'PL' | 'HL' | 'LAP' | 'BL' | 'WC'
export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE'

export const POLICY_PRODUCTS: PolicyProduct[] = ['PL', 'HL', 'LAP', 'BL', 'WC']

/** Products for which the collateral parameter group is meaningful. */
export const COLLATERAL_PRODUCTS: PolicyProduct[] = ['HL', 'LAP', 'WC']

export type PolicyEmploymentType = 'SALARIED' | 'SELF_EMPLOYED'
export type PolicyResidency = 'RESIDENT' | 'NRI'
export type PolicyThinFileTreatment = 'REFER' | 'DECLINE' | 'MANUAL_REVIEW'
export type PolicyCollateralType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'LAND'

export interface PolicyApplicantParams {
  age_min: number | null
  age_max: number | null
  employment_types: PolicyEmploymentType[]
  min_employment_vintage_years: number | null
  residency: PolicyResidency[]
}

export interface PolicyFinancialParams {
  min_monthly_income: number | null
  /** Months of income averaged before assessing affordability. */
  income_averaging_months: number | null
  /** Discount applied to variable pay (incentives, bonus) before it counts. */
  variable_income_haircut_percent: number | null
  max_foir_percent: number | null
  max_dti_percent: number | null
  /** Discount applied to declared existing obligations. */
  obligation_haircut_percent: number | null
}

export interface PolicyBureauParams {
  min_bureau_score: number | null
  /** How to treat an applicant with too little bureau history to score. */
  thin_file_treatment: PolicyThinFileTreatment | null
  max_dpd_30_count: number | null
  max_dpd_90_count: number | null
  exclude_write_off: boolean
  exclude_settlement: boolean
  max_enquiries_last_6m: number | null
}

/** Only meaningful for HL/LAP/WC, but stored for every product so a policy's
 *  shape stays uniform; the form and detail view hide it for PL/BL. */
export interface PolicyCollateralParams {
  max_ltv_percent: number | null
  min_property_value: number | null
  valuation_age_max_months: number | null
  accepted_collateral_types: PolicyCollateralType[]
}

export interface PolicyPricingParams {
  min_amount: number | null
  max_amount: number | null
  min_tenure_years: number | null
  max_tenure_years: number | null
  base_rate_percent: number | null
  max_risk_premium_percent: number | null
  processing_fee_percent: number | null
}

export interface PolicyDecisionParams {
  hard_decline_triggers: string[]
  refer_triggers: string[]
  /** Same DocumentType vocabulary as DOC_CATEGORIES/DOC_TYPE_LABEL. */
  required_documents: DocumentType[]
}

/** A curated, bounded subset of the reference requirements sheet's parameter
 *  groups — enough to express a real credit box, not the full field list. */
export interface PolicyParams {
  applicant: PolicyApplicantParams
  financial: PolicyFinancialParams
  bureau: PolicyBureauParams
  collateral: PolicyCollateralParams
  pricing: PolicyPricingParams
  decision: PolicyDecisionParams
}

/**
 * One version of a credit policy.
 *
 * Deliberately a slice of the enterprise "Configurable LOS Policy Engine"
 * requirements: this is the authoring/browsing repository only. Nothing
 * evaluates these params — there is no rule engine, no Decision-tab wiring
 * and no Auto Run (the requirements sheet's own scope table puts those out of
 * scope), and no maker-checker approval chain, because this app has only
 * `dsa_partner` and `ops_admin` and no separate Approver role.
 *
 * Versioning is single-actor: `policy_code` is the stable identity, `version`
 * increments, and a published version is duplicated as a new DRAFT rather
 * than edited in place. Activating a version deactivates any other ACTIVE
 * version sharing its `policy_code`. See the Policy-tab entry in
 * /knowledge/lendstream-dsa-hub/knowledge.md.
 */
export interface Policy {
  id: string
  policy_code: string
  version: number
  name: string
  description: string | null
  product: PolicyProduct
  status: PolicyStatus
  /** Lower = evaluated first. Informational only — nothing consumes it yet. */
  priority: number
  effective_from: string | null
  effective_to: string | null
  change_reason: string | null
  params: PolicyParams
  created_by: string
  created_at: string
  updated_at: string
  activated_at: string | null
}

export const POLICY_STATUS_STYLES: Record<PolicyStatus, string> = {
  ACTIVE: 'bg-[#e8f3ee] text-[#16694a]',
  DRAFT: 'bg-[#f7f0e2] text-[#85580d]',
  INACTIVE: 'bg-[#efeeeb] text-[#7c7a75]',
}

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  ACTIVE: 'Active', DRAFT: 'Draft', INACTIVE: 'Inactive',
}

/** Knock-out reasons an ops admin can pin to a policy. Free checkbox subset —
 *  labels only; nothing in this scope evaluates them. */
export const POLICY_HARD_DECLINE_TRIGGERS: Record<string, string> = {
  BUREAU_DEFAULT: 'Bureau default',
  FRAUD_FLAG: 'Fraud flag',
  NEGATIVE_GEOGRAPHY: 'Negative geography',
  WRITE_OFF_ON_FILE: 'Write-off on file',
}

export const POLICY_REFER_TRIGGERS: Record<string, string> = {
  THIN_FILE: 'Thin file',
  INCOME_UNVERIFIED: 'Income unverified',
  HIGH_FOIR: 'High FOIR',
  SCORE_BELOW_CUTOFF: 'Score below cutoff',
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
