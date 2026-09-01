import { fmtAmount } from '@/lib/format'
import type {
  Policy, PolicyCollateralType, PolicyEmploymentType, PolicyParams,
  PolicyResidency, PolicyThinFileTreatment,
} from '@/lib/types'

/**
 * Fills in every group of a policy's params. Rows written before a group
 * existed — or by a form that skipped an optional section — come back with
 * that key absent, and every consumer wants to read `params.bureau.x` without
 * guarding each level.
 */
export function normalizePolicyParams(raw: Partial<PolicyParams> | null | undefined): PolicyParams {
  const p = raw ?? {}
  return {
    applicant: {
      age_min: null, age_max: null, employment_types: [],
      min_employment_vintage_years: null, residency: [],
      ...(p.applicant ?? {}),
    },
    financial: {
      min_monthly_income: null, income_averaging_months: null,
      variable_income_haircut_percent: null, max_foir_percent: null,
      max_dti_percent: null, obligation_haircut_percent: null,
      ...(p.financial ?? {}),
    },
    bureau: {
      min_bureau_score: null, thin_file_treatment: null, max_dpd_30_count: null,
      max_dpd_90_count: null, exclude_write_off: false, exclude_settlement: false,
      max_enquiries_last_6m: null,
      ...(p.bureau ?? {}),
    },
    collateral: {
      max_ltv_percent: null, min_property_value: null,
      valuation_age_max_months: null, accepted_collateral_types: [],
      ...(p.collateral ?? {}),
    },
    pricing: {
      min_amount: null, max_amount: null, min_tenure_years: null,
      max_tenure_years: null, base_rate_percent: null,
      max_risk_premium_percent: null, processing_fee_percent: null,
      ...(p.pricing ?? {}),
    },
    decision: {
      hard_decline_triggers: [], refer_triggers: [], required_documents: [],
      ...(p.decision ?? {}),
    },
  }
}

export const EMPLOYMENT_TYPE_LABEL: Record<PolicyEmploymentType, string> = {
  SALARIED: 'Salaried', SELF_EMPLOYED: 'Self-employed',
}

export const RESIDENCY_LABEL: Record<PolicyResidency, string> = {
  RESIDENT: 'Resident', NRI: 'NRI',
}

export const THIN_FILE_LABEL: Record<PolicyThinFileTreatment, string> = {
  REFER: 'Refer', DECLINE: 'Decline', MANUAL_REVIEW: 'Manual review',
}

export const COLLATERAL_TYPE_LABEL: Record<PolicyCollateralType, string> = {
  RESIDENTIAL: 'Residential', COMMERCIAL: 'Commercial', INDUSTRIAL: 'Industrial', LAND: 'Land',
}

/**
 * A one-line, human-readable digest of the most decision-relevant params, for
 * the Live policy cards. Only the parts that are actually configured appear —
 * an unconfigured policy honestly reads as having nothing set.
 */
export function policySummaryLine(params: PolicyParams): string | null {
  const bits: string[] = []
  if (params.bureau.min_bureau_score != null) bits.push(`Bureau ≥ ${params.bureau.min_bureau_score}`)
  if (params.financial.max_foir_percent != null) bits.push(`FOIR ≤ ${params.financial.max_foir_percent}%`)
  if (params.pricing.min_amount != null || params.pricing.max_amount != null) {
    bits.push(`${fmtShortAmount(params.pricing.min_amount)}–${fmtShortAmount(params.pricing.max_amount)}`)
  }
  if (params.collateral.max_ltv_percent != null) bits.push(`LTV ≤ ${params.collateral.max_ltv_percent}%`)
  return bits.length ? bits.join(' · ') : null
}

function fmtShortAmount(amount: number | null): string {
  return amount == null ? '—' : fmtAmount(amount)
}

/** Effective window as one string, or null when neither end is dated. */
export function effectiveWindow(policy: Pick<Policy, 'effective_from' | 'effective_to'>): string | null {
  const { effective_from: from, effective_to: to } = policy
  if (!from && !to) return null
  return `${from ?? '—'} → ${to ?? 'open'}`
}
