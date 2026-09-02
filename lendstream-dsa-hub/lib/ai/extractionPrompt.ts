import { z } from 'zod'
import type { DocumentType } from '@/lib/types'

// Full Aadhaar numbers are never extracted or persisted — only the last 4
// digits, even though a raw Aadhaar card image will contain the full number
// in its OCR text. See /decisions/2026-08-22-lendstream-dsa-hub-architecture.md.
export function redactAadhaar(text: string): string {
  return text.replace(/\b(\d{4})[\s-]?(\d{4})[\s-]?(\d{4})\b/g, 'XXXX XXXX $3')
}

const panSchema = z.object({
  name: z.string().nullable(),
  pan_number: z.string().nullable(),
  dob: z.string().nullable(),
})

const aadhaarSchema = z.object({
  name: z.string().nullable(),
  dob: z.string().nullable(),
  address: z.string().nullable(),
  aadhaar_last4: z.string().nullable(),
})

const salarySlipSchema = z.object({
  employee_name: z.string().nullable(),
  employer_name: z.string().nullable(),
  month: z.string().nullable(),
  gross_salary: z.number().nullable(),
  net_salary: z.number().nullable(),
  deductions: z.number().nullable(),
})

/** One ranked payer / supplier read off the statement's transaction narrations. */
const counterpartySchema = z.object({
  name: z.string().nullable(),
  amount: z.number().nullable(),
  txn_count: z.number().nullable(),
  share_percent: z.number().nullable(),
  recurring: z.boolean().nullable(),
  first_seen: z.string().nullable(),
  last_seen: z.string().nullable(),
})

/** One classified slice of credits or debits. */
const categorySchema = z.object({
  label: z.string().nullable(),
  amount: z.number().nullable(),
  share_percent: z.number().nullable(),
})

const bankStatementSchema = z.object({
  account_holder_name: z.string().nullable(),
  account_number: z.string().nullable(),
  bank_name: z.string().nullable(),
  ifsc: z.string().nullable(),
  branch: z.string().nullable(),
  account_type: z.string().nullable(),
  avg_monthly_balance: z.number().nullable(),
  monthly_credits: z.array(z.number()).nullable(),
  monthly_debits: z.array(z.number()).nullable(),
  salary_credits_detected: z.boolean().nullable(),
  /** Per-month statement rows — powers the month-by-month analysis table. */
  months: z.array(z.object({
    month: z.string().nullable(),
    credits: z.number().nullable(),
    debits: z.number().nullable(),
    closing_balance: z.number().nullable(),
    min_balance: z.number().nullable(),
    bounces: z.number().nullable(),
  })).nullable(),
  total_bounces: z.number().nullable(),
  cash_deposit_percent: z.number().nullable(),
  od_sanctioned_limit: z.number().nullable(),
  od_utilisation_percent: z.number().nullable(),
  /** How long the relationship has run, if the statement states it. */
  account_vintage_months: z.number().nullable(),
  /** True only when the statement was pulled through an Account Aggregator. */
  aa_verified: z.boolean().nullable(),
  /** Ranked counterparties — powers "Money received from" / "Money paid to". */
  top_inflows: z.array(counterpartySchema).nullable(),
  top_outflows: z.array(counterpartySchema).nullable(),
  /** Every rupee classified — powers "Where credits came from" / "went". */
  credit_categories: z.array(categorySchema).nullable(),
  debit_categories: z.array(categorySchema).nullable(),
})

/**
 * One assessment year off an ITR set. A single "ITR (3 years)" upload normally
 * carries two or three returns, so the year is the unit — the same way a bank
 * statement is captured month by month.
 */
const itrYearSchema = z.object({
  assessment_year: z.string().nullable(),
  /** The previous year the return covers — labels the multi-year comparatives. */
  financial_year: z.string().nullable(),
  itr_form: z.string().nullable(),
  nature_of_income: z.string().nullable(),
  /** 44AD / 44ADA / 44AE — detailed expense lines are absent on these returns. */
  is_presumptive: z.boolean().nullable(),
  presumptive_section: z.string().nullable(),
  /** Income by head. */
  gross_total_income: z.number().nullable(),
  taxable_income: z.number().nullable(),
  total_deductions: z.number().nullable(),
  salary_income: z.number().nullable(),
  business_income: z.number().nullable(),
  rental_income: z.number().nullable(),
  interest_income: z.number().nullable(),
  other_income: z.number().nullable(),
  /** Computation of business / professional income. */
  business_turnover: z.number().nullable(),
  gross_profit: z.number().nullable(),
  net_profit: z.number().nullable(),
  depreciation: z.number().nullable(),
  interest_expense: z.number().nullable(),
  partner_remuneration: z.number().nullable(),
  business_expenses: z.number().nullable(),
  losses_carried_forward: z.number().nullable(),
  /** Tax compliance. */
  tax_payable: z.number().nullable(),
  tax_paid: z.number().nullable(),
  advance_tax_paid: z.number().nullable(),
  tds_credit: z.number().nullable(),
  tax_demand_outstanding: z.number().nullable(),
  filing_date: z.string().nullable(),
  filed_on_time: z.boolean().nullable(),
  return_status: z.string().nullable(),
  is_revised_return: z.boolean().nullable(),
  revision_count: z.number().nullable(),
  /** Balance-sheet block, present on ITR-3 and some ITR-5 returns. */
  net_worth: z.number().nullable(),
  business_assets: z.number().nullable(),
  unsecured_loans: z.number().nullable(),
  capital_introduced: z.number().nullable(),
  trade_creditors: z.number().nullable(),
  negative_capital: z.boolean().nullable(),
})

const itrSchema = z.object({
  assessee_name: z.string().nullable(),
  pan_number: z.string().nullable(),
  /** Latest year's headline figures, mirrored by the last entry of `years`. */
  assessment_year: z.string().nullable(),
  itr_form: z.string().nullable(),
  nature_of_income: z.string().nullable(),
  is_presumptive: z.boolean().nullable(),
  gross_total_income: z.number().nullable(),
  taxable_income: z.number().nullable(),
  business_turnover: z.number().nullable(),
  net_profit: z.number().nullable(),
  tax_paid: z.number().nullable(),
  tax_demand_outstanding: z.number().nullable(),
  /** Every return in the upload, OLDEST FIRST — powers the income trend. */
  years: z.array(itrYearSchema).nullable(),
})

/**
 * One return period off a GST upload — the GSTR-1 and the GSTR-3B for the same
 * month or quarter. The period is the unit, the same way an assessment year is
 * the unit of an ITR set: the GSTR-1-vs-GSTR-3B consistency check, the
 * seasonality read and the filing-regularity read are all derived from it.
 */
const gstPeriodSchema = z.object({
  month: z.string().nullable(),
  /**
   * The period's headline taxable turnover — the GSTR-3B figure where the
   * return set carries both. Always populated when any turnover is stated.
   */
  taxable_value: z.number().nullable(),
  /** Outward supplies as reported in GSTR-1 for this period. */
  gstr1_taxable_value: z.number().nullable(),
  /** Outward supplies as declared in GSTR-3B for this period. */
  gstr3b_taxable_value: z.number().nullable(),
  /** GST actually discharged in cash for this period (not through ITC). */
  tax_paid_cash: z.number().nullable(),
  itc_claimed: z.number().nullable(),
  filed_on_time: z.boolean().nullable(),
  /** True when a nil return was filed for this period. */
  nil_return: z.boolean().nullable(),
})

const gstSchema = z.object({
  /** Registration and business identity. */
  gstin: z.string().nullable(),
  /**
   * "ACTIVE" | "CANCELLED" | "SUSPENDED". Kept as a plain string, like every
   * other constrained-vocabulary field in this file — a strict enum would fail
   * the WHOLE extraction on a casing slip, and sections.ts normalises it.
   */
  gstin_status: z.string().nullable(),
  legal_name: z.string().nullable(),
  trade_name: z.string().nullable(),
  constitution: z.string().nullable(),
  principal_place_of_business: z.string().nullable(),
  /** Date the GSTIN was granted — drives the business-vintage read. */
  registration_date: z.string().nullable(),
  /** Other GSTINs / state registrations the return set mentions. */
  additional_registrations_count: z.number().nullable(),
  /**
   * Annual turnover if the return set states one; otherwise summed from the
   * periods. READ DIRECTLY by lib/decision/rulesEngine.ts::gstPillar as a
   * top-level number — do not rename, nest or remove it.
   */
  turnover: z.number().nullable(),
  filing_month: z.string().nullable(),
  filing_frequency: z.string().nullable(),
  business_type: z.string().nullable(),
  /** One row per return period, OLDEST FIRST — powers trend, seasonality and
   *  the GSTR-1 vs GSTR-3B reconciliation. */
  monthly_turnover: z.array(gstPeriodSchema).nullable(),
  prior_year_turnover: z.number().nullable(),
  /** GSTR-1 composition of outward supplies. */
  b2b_turnover: z.number().nullable(),
  b2c_turnover: z.number().nullable(),
  export_turnover: z.number().nullable(),
  interstate_turnover: z.number().nullable(),
  credit_notes_value: z.number().nullable(),
  top_counterparty_percent: z.number().nullable(),
  top_five_counterparty_percent: z.number().nullable(),
  /** GSTR-3B liability and tax payment. */
  gst_liability: z.number().nullable(),
  tax_paid_cash: z.number().nullable(),
  itc_utilised: z.number().nullable(),
  itc_claimed: z.number().nullable(),
  reverse_charge_liability: z.number().nullable(),
  interest_and_late_fees: z.number().nullable(),
  tax_payable_carried_forward: z.number().nullable(),
  returns_due: z.number().nullable(),
  returns_filed: z.number().nullable(),
  late_filings: z.number().nullable(),
  /** Consistency inputs — reconciled against the periods and other documents. */
  gstr9_annual_turnover: z.number().nullable(),
  gstr2b_itc: z.number().nullable(),
  /** Compliance flags the return set itself may state. */
  has_notices_or_mismatches: z.boolean().nullable(),
  gstin_cancelled_or_suspended_note: z.string().nullable(),
  amendment_count: z.number().nullable(),
})

const propertySchema = z.object({
  owner_name: z.string().nullable(),
  property_address: z.string().nullable(),
  registered_value: z.number().nullable(),
})

const valuationSchema = z.object({
  valuer_name: z.string().nullable(),
  property_address: z.string().nullable(),
  valuation_amount: z.number().nullable(),
  valuation_date: z.string().nullable(),
  /** Distress / realisable value the valuer puts on the same asset. */
  realisable_value: z.number().nullable(),
  property_type: z.string().nullable(),
  built_up_area_sqft: z.number().nullable(),
  property_age_years: z.number().nullable(),
  location_tier: z.string().nullable(),
  occupancy: z.string().nullable(),
  ownership: z.string().nullable(),
  existing_encumbrance: z.number().nullable(),
  legal_status: z.string().nullable(),
  technical_status: z.string().nullable(),
  title_clear: z.boolean().nullable(),
  approved_by_authority: z.boolean().nullable(),
  chain_of_title_years: z.number().nullable(),
  monthly_rental_income: z.number().nullable(),
})

const creditReportSchema = z.object({
  bureau_name: z.string().nullable(),
  score: z.number().nullable(),
  live_dpd: z.string().nullable(),
  total_monthly_obligations: z.number().nullable(),
  credit_vintage_years: z.number().nullable(),
  revolving_utilisation_percent: z.number().nullable(),
  commercial_rank: z.string().nullable(),
  /** Portfolio shape — powers "Live obligations" and "Secured mix". */
  active_accounts: z.number().nullable(),
  closed_accounts: z.number().nullable(),
  active_unsecured_loans: z.number().nullable(),
  total_sanctioned: z.number().nullable(),
  total_outstanding: z.number().nullable(),
  secured_exposure: z.number().nullable(),
  unsecured_exposure: z.number().nullable(),
  /** Repayment track. */
  current_dpd: z.number().nullable(),
  dpd_30_count: z.number().nullable(),
  dpd_60_count: z.number().nullable(),
  dpd_90_plus_count: z.number().nullable(),
  overdue_amount: z.number().nullable(),
  /** Adverse records. */
  write_off_count: z.number().nullable(),
  settlement_count: z.number().nullable(),
  suit_filed_count: z.number().nullable(),
  /** Behaviour. */
  enquiries_6m: z.number().nullable(),
  enquiries_12m: z.number().nullable(),
  oldest_account_months: z.number().nullable(),
})

const stockStatementSchema = z.object({
  statement_month: z.string().nullable(),
  audit_date: z.string().nullable(),
  gross_stock: z.number().nullable(),
  /** Inventory breakdown as declared on the statement. */
  raw_material: z.number().nullable(),
  wip: z.number().nullable(),
  finished_goods: z.number().nullable(),
  /** Margin the lender holds back before stock counts toward drawing power. */
  margin_percent: z.number().nullable(),
  net_eligible_stock: z.number().nullable(),
  book_debts: z.number().nullable(),
  creditors: z.number().nullable(),
  drawing_power: z.number().nullable(),
  sanctioned_limit: z.number().nullable(),
  limit_utilisation_percent: z.number().nullable(),
})

/** One financial year off a P&L / balance sheet — the statement usually shows 2-3. */
const financialYearSchema = z.object({
  financial_year: z.string().nullable(),
  revenue: z.number().nullable(),
  gross_profit: z.number().nullable(),
  ebitda: z.number().nullable(),
  depreciation: z.number().nullable(),
  interest: z.number().nullable(),
  pat: z.number().nullable(),
  net_worth: z.number().nullable(),
  total_debt: z.number().nullable(),
  current_assets: z.number().nullable(),
  current_liabilities: z.number().nullable(),
  inventory: z.number().nullable(),
  receivables: z.number().nullable(),
  payables: z.number().nullable(),
  cash_balance: z.number().nullable(),
})

const financialStatementSchema = z.object({
  financial_year: z.string().nullable(),
  revenue: z.number().nullable(),
  gross_profit: z.number().nullable(),
  ebitda: z.number().nullable(),
  depreciation: z.number().nullable(),
  interest: z.number().nullable(),
  pat: z.number().nullable(),
  net_worth: z.number().nullable(),
  total_debt: z.number().nullable(),
  current_assets: z.number().nullable(),
  current_liabilities: z.number().nullable(),
  inventory: z.number().nullable(),
  receivables: z.number().nullable(),
  payables: z.number().nullable(),
  cash_balance: z.number().nullable(),
  /** Annual principal + interest falling due — the denominator of DSCR. */
  debt_service: z.number().nullable(),
  /** Comparatives, oldest first — powers the three-year P&L / balance sheet. */
  years: z.array(financialYearSchema).nullable(),
})

const genericSchema = z.object({
  summary: z.string().nullable(),
})

export const SCHEMA_BY_TYPE: Record<DocumentType, z.ZodTypeAny> = {
  PAN_CARD: panSchema,
  AADHAAR: aadhaarSchema,
  SALARY_SLIP: salarySlipSchema,
  BANK_STATEMENT: bankStatementSchema,
  ITR: itrSchema,
  GST_RETURNS: gstSchema,
  PROPERTY_DEED: propertySchema,
  BUILDER_AGREEMENT: propertySchema,
  OCCUPANCY_CERTIFICATE: propertySchema,
  PROPERTY_VALUATION: valuationSchema,
  CREDIT_REPORT: creditReportSchema,
  STOCK_STATEMENT: stockStatementSchema,
  FINANCIAL_STATEMENT: financialStatementSchema,
  OTHER: genericSchema,
}

const FIELD_HINTS: Record<DocumentType, string> = {
  PAN_CARD: 'name, pan_number (10-char alphanumeric), dob (DD/MM/YYYY)',
  AADHAAR: 'name, dob, address, aadhaar_last4 (ONLY the last 4 digits — never output the full 12-digit number)',
  SALARY_SLIP: 'employee_name, employer_name, month, gross_salary (number), net_salary (number), deductions (number)',
  BANK_STATEMENT: 'account_holder_name, account_number (mask all but the last 4 digits), bank_name, ifsc, branch, account_type, avg_monthly_balance (number), monthly_credits (array of numbers), monthly_debits (array of numbers), salary_credits_detected (boolean), months (array of {month, credits, debits, closing_balance, min_balance, bounces} — one entry per statement month), total_bounces (number), cash_deposit_percent (number), od_sanctioned_limit (number), od_utilisation_percent (number), account_vintage_months (number), aa_verified (boolean — true only if the statement is an Account Aggregator pull), top_inflows (array of {name, amount, txn_count, share_percent, recurring, first_seen, last_seen} — the largest payers by total credit, read off the narrations, highest first), top_outflows (same shape — the largest suppliers/vendors by total debit), credit_categories (array of {label, amount, share_percent} classifying every credit, e.g. "Business receipts", "Cash deposits", "Loan disbursements", "Inter-account transfers", "Other credits"), debit_categories (same shape, e.g. "Supplier payments", "Salary & wages", "Statutory — GST, TDS, PF", "Loan EMIs", "Rent & utilities", "Promoter drawings", "Cash withdrawals")',
  ITR: 'assessee_name, pan_number, and for the LATEST assessment year: assessment_year (e.g. "2025-26"), itr_form, nature_of_income, is_presumptive (boolean), gross_total_income (number), taxable_income (number), business_turnover (number), net_profit (number), tax_paid (number), tax_demand_outstanding (number). Also years (array, OLDEST FIRST, one entry per assessment year the upload contains — an ITR set normally carries two or three) where each entry has: assessment_year, financial_year (the previous year the return covers, e.g. "2024-25"), itr_form ("ITR-1" | "ITR-2" | "ITR-3" | "ITR-4" | "ITR-5" | "ITR-6" | "ITR-7"), nature_of_income ("SALARIED" | "PROPRIETOR" | "PARTNER" | "DIRECTOR" | "PROFESSIONAL" | "COMMISSION_FREELANCE" | "RENT_INVESTMENT" | "AGRICULTURE" — the head the bulk of the income sits under), is_presumptive (boolean — true when income is declared under section 44AD, 44ADA or 44AE), presumptive_section ("44AD" | "44ADA" | "44AE"), gross_total_income (number), taxable_income (number — total income after Chapter VI-A), total_deductions (number — Chapter VI-A deductions), salary_income (number), business_income (number — income from business or profession), rental_income (number — income from house property), interest_income (number), other_income (number), business_turnover (number — gross receipts / turnover / sales), gross_profit (number), net_profit (number), depreciation (number), interest_expense (number — interest debited to the P&L), partner_remuneration (number — remuneration and interest paid to partners), business_expenses (number — total expenses debited), losses_carried_forward (number), tax_payable (number), tax_paid (number — total taxes paid), advance_tax_paid (number), tds_credit (number — TDS credit claimed), tax_demand_outstanding (number — 0 if no demand), filing_date (date the return was filed), filed_on_time (boolean — true if filed on or before the due date for that year), return_status ("FILED" | "PROCESSED" | "UNDER_PROCESSING" | "DEFECTIVE" | "REVISED"), is_revised_return (boolean), revision_count (number), net_worth (number — proprietor/partner capital or shareholders funds, negative if capital is eroded), business_assets (number — total assets on the balance sheet), unsecured_loans (number — unsecured and related-party loans), capital_introduced (number — capital introduced during the year), trade_creditors (number — sundry creditors), negative_capital (boolean). Leave any field the return does not carry as null — a presumptive 44AD/44ADA return will have no detailed expense, depreciation or balance-sheet lines, and a salaried ITR-1 will have no business figures',
  GST_RETURNS: 'gstin, gstin_status ("ACTIVE" | "CANCELLED" | "SUSPENDED"), legal_name, trade_name, constitution ("PROPRIETORSHIP" | "PARTNERSHIP" | "LLP" | "PRIVATE_LIMITED" | "PUBLIC_LIMITED" | "HUF" | "TRUST" | "SOCIETY"), principal_place_of_business, registration_date (date the GSTIN was granted), additional_registrations_count (number — other GSTINs / state registrations the document mentions, 0 if none stated), turnover (number — ANNUAL turnover, only if stated), filing_month, filing_frequency ("MONTHLY" | "QUARTERLY" | "COMPOSITION"), business_type ("MANUFACTURER" | "TRADER" | "RETAILER" | "WHOLESALER" | "SERVICE_PROVIDER"), monthly_turnover (array, OLDEST FIRST, one entry per return period, each {month, taxable_value (number — the period\'s headline taxable turnover: use the GSTR-3B figure when the set carries both, else the GSTR-1 figure; always fill this whenever any turnover is stated for the period), gstr1_taxable_value (number — outward supplies per GSTR-1), gstr3b_taxable_value (number — outward supplies per GSTR-3B), tax_paid_cash (number — GST discharged in cash for the period, not through ITC), itc_claimed (number), filed_on_time (boolean — true if the return for that period was filed on or before its due date), nil_return (boolean — true if a nil return was filed for that period)}), prior_year_turnover (number), b2b_turnover (number — registered-buyer sales), b2c_turnover (number — unregistered/consumer sales), export_turnover (number — including zero-rated SEZ supplies), interstate_turnover (number), credit_notes_value (number — credit notes and sales reversals), top_counterparty_percent (number — largest buyer as a share of turnover), top_five_counterparty_percent (number), gst_liability (number — total GST liability declared in GSTR-3B), tax_paid_cash (number — total tax actually discharged in cash), itc_utilised (number — ITC set off against the liability), itc_claimed (number — ITC claimed in GSTR-3B table 4), reverse_charge_liability (number), interest_and_late_fees (number), tax_payable_carried_forward (number — liability declared but not discharged), returns_due (number), returns_filed (number), late_filings (number), gstr9_annual_turnover (number — from the GSTR-9 annual return where the set includes one, else null), gstr2b_itc (number — ITC auto-populated in GSTR-2B, for the mismatch check), has_notices_or_mismatches (boolean — true only if the document states a notice, a return mismatch or a DRC/ASMT reference), gstin_cancelled_or_suspended_note (free text if the return set mentions cancellation or suspension, else null), amendment_count (number — invoice amendments made to earlier periods). Leave anything the return set does not carry as null — a composition taxpayer files CMP-08 rather than GSTR-3B and will have no ITC lines, and a set of monthly returns without a GSTR-9 will have no gstr9_annual_turnover',
  PROPERTY_DEED: 'owner_name, property_address, registered_value (number)',
  BUILDER_AGREEMENT: 'owner_name, property_address, registered_value (number)',
  OCCUPANCY_CERTIFICATE: 'owner_name, property_address, registered_value (number)',
  PROPERTY_VALUATION: 'valuer_name, property_address, valuation_amount (number — fair market value), valuation_date, realisable_value (number — distress/realisable value), property_type ("RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "PLOT"), built_up_area_sqft (number), property_age_years (number), location_tier ("TIER_1" | "TIER_2" | "TIER_3"), occupancy ("SELF_OCCUPIED" | "RENTED" | "VACANT"), ownership ("SOLE" | "JOINT"), existing_encumbrance (number — amount of any subsisting charge, 0 if unencumbered), legal_status ("CLEARED" | "IN_PROGRESS" | "NOT_STARTED" | "ADVERSE"), technical_status (same set), title_clear (boolean), approved_by_authority (boolean), chain_of_title_years (number), monthly_rental_income (number)',
  CREDIT_REPORT: 'bureau_name (CIBIL/Experian/CRIF), score (number 300-900), live_dpd (e.g. "None" or "30+"), total_monthly_obligations (number), credit_vintage_years (number), revolving_utilisation_percent (number), commercial_rank (e.g. "CMR-8"), active_accounts (number), closed_accounts (number), active_unsecured_loans (number), total_sanctioned (number), total_outstanding (number), secured_exposure (number), unsecured_exposure (number), current_dpd (number — days past due on any live facility, 0 if none), dpd_30_count (number), dpd_60_count (number), dpd_90_plus_count (number), overdue_amount (number), write_off_count (number), settlement_count (number), suit_filed_count (number), enquiries_6m (number), enquiries_12m (number), oldest_account_months (number)',
  STOCK_STATEMENT: 'statement_month, audit_date, gross_stock (number), raw_material (number), wip (number — work in progress), finished_goods (number), margin_percent (number — the margin the lender holds back on stock), net_eligible_stock (number), book_debts (number), creditors (number), drawing_power (number), sanctioned_limit (number), limit_utilisation_percent (number)',
  FINANCIAL_STATEMENT: 'financial_year (e.g. "2025-26"), and for the latest year: revenue, gross_profit, ebitda, depreciation, interest, pat, net_worth, total_debt, current_assets, current_liabilities, inventory, receivables, payables, cash_balance, debt_service (all numbers — annual principal + interest falling due for debt_service). Also years (array of the same per-year fields plus financial_year, one entry per year shown in the comparatives, OLDEST FIRST)',
  OTHER: 'summary (a one-sentence description of the document)',
}

export function buildExtractionPrompt(type: DocumentType, ocrText: string): string {
  return `You extract structured data from OCR text of an Indian loan-application document (type: ${type}).
Return ONLY a JSON object with exactly these fields: ${FIELD_HINTS[type]}.
Use null for any field you cannot find. Do not invent values. Do not include any text outside the JSON object.
${type === 'AADHAAR' ? 'CRITICAL: never output more than the last 4 digits of the Aadhaar number.' : ''}

OCR TEXT:
"""
${ocrText.slice(0, 6000)}
"""`
}

export interface ExtractionResult {
  data: Record<string, unknown> | null
  confidence: number
  error?: string
}

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434'
const MODEL = process.env.OLLAMA_MODEL ?? 'gemma3:4b'

export async function extractStructured(type: DocumentType, ocrText: string): Promise<ExtractionResult> {
  const schema = SCHEMA_BY_TYPE[type]
  const prompt = buildExtractionPrompt(type, ocrText)

  let response: Response
  try {
    response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, prompt, format: 'json', stream: false }),
    })
  } catch (err) {
    return { data: null, confidence: 0, error: `Could not reach Ollama at ${OLLAMA_HOST}: ${(err as Error).message}` }
  }

  if (!response.ok) {
    return { data: null, confidence: 0, error: `Ollama returned ${response.status}` }
  }

  const body = await response.json() as { response: string }
  let parsed: unknown
  try {
    parsed = JSON.parse(body.response)
  } catch {
    return { data: null, confidence: 0, error: 'Model did not return valid JSON' }
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    return { data: null, confidence: 0, error: `Extraction did not match expected schema: ${result.error.message}` }
  }

  const fields = Object.values(result.data as Record<string, unknown>)
  const populated = fields.filter((v) => v !== null && v !== undefined && v !== '').length
  // Heuristic only — the fraction of expected schema fields the model
  // actually populated. Not a calibrated model confidence score.
  const confidence = fields.length ? populated / fields.length : 0

  return { data: result.data as Record<string, unknown>, confidence }
}
