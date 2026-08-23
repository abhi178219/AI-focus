/**
 * Unsecured business-loan eligibility, sized four different ways.
 *
 * Ported from the reference prototype's workbook-backed model. Each basis
 * computes an indicative amount, then a policy cap is applied on top — the
 * final number is min(calculated, cap), and zero if the policy gate fails.
 * All thresholds are exposed as editable variables so a credit team can
 * retune them without a code change.
 */

export type UblBasis = 'ABB' | 'GST' | 'UNAUDITED' | 'AUDITED'

export const UBL_BASES: { key: UblBasis; label: string; short: string; blurb: string }[] = [
  { key: 'ABB', label: 'Average Banking', short: 'ABB', blurb: 'Sizes off average bank balance and the EMI it can carry.' },
  { key: 'GST', label: 'GST Turnover', short: 'GST', blurb: 'Applies a trade-margin policy to declared GST turnover.' },
  { key: 'UNAUDITED', label: 'Unaudited Financials', short: 'Unaudited', blurb: 'Multiples of monthly profit after tax.' },
  { key: 'AUDITED', label: 'Audited Financials', short: 'Audited', blurb: 'Revenue with add-backs, less annual obligations.' },
]

export type BusinessType = 'Trader' | 'Manufacturer' | 'Service Provider' | 'Retailer' | 'Wholesaler'
export const BUSINESS_TYPES: BusinessType[] = ['Trader', 'Manufacturer', 'Service Provider', 'Retailer', 'Wholesaler']

/** Gross-margin assumption per trade type, used by the GST basis. */
const GST_MARGIN: Record<BusinessType, number> = {
  Wholesaler: 4, Trader: 4.5, Retailer: 5, 'Service Provider': 6, Manufacturer: 7.5,
}

export interface UblLoan { emi: number; paid: number }

export interface UblState {
  desiredLoan: number
  businessType: BusinessType
  organisationAge: number
  cibil: number
  loansTaken: number
  activeLoans: number
  loans: UblLoan[]
  auditedIncome: number
  pat: number
  gstTurnover: number
  avgBanking: number
  interestLoan: number
  depreciation: number
  remuneration: number
  capitalInterest: number
  // Calculation variables — editable policy knobs.
  rate: number
  tenure: number
  obligationMonths: number
  abbCapacityPct: number
  abbEligibilityPct: number
  gstFoirPct: number
  patMultiplier: number
  auditedMultiplier: number
  remunerationPct: number
}

export const UBL_DEFAULTS: UblState = {
  desiredLoan: 2000000,
  businessType: 'Manufacturer',
  organisationAge: 5,
  cibil: 750,
  loansTaken: 3,
  activeLoans: 2,
  loans: [
    { emi: 15000, paid: 1 },
    { emi: 20000, paid: 5 },
    { emi: 10000, paid: 5 },
    { emi: 0, paid: 0 },
    { emi: 0, paid: 0 },
    { emi: 0, paid: 0 },
  ],
  auditedIncome: 6000000,
  pat: 6000000,
  gstTurnover: 35000000,
  avgBanking: 390000,
  interestLoan: 500000,
  depreciation: 200000,
  remuneration: 2400000,
  capitalInterest: 100000,
  rate: 16,
  tenure: 36,
  obligationMonths: 36,
  abbCapacityPct: 25,
  abbEligibilityPct: 80,
  gstFoirPct: 80,
  patMultiplier: 2,
  auditedMultiplier: 2.5,
  remunerationPct: 70,
}

export interface UblPolicy { cap: number; eligible: boolean; reason?: string }

export interface UblResult {
  calculated: number
  finalEligibility: number
  policy: UblPolicy
  obligation: number
  driver: string
  requestedEmi: number
  eligibleEmi: number
}

const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0)

export function ublMonthlyEmi(principal: number, rate: number, tenureMonths: number): number {
  const r = rate / 100 / 12
  const m = Math.max(1, tenureMonths)
  return r ? (principal * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1) : principal / m
}

/** Remaining rupee obligation across running loans over the obligation window. */
function ublObligation(s: UblState): number {
  return s.loans.reduce((sum, l) => sum + n(l.emi) * Math.max(s.obligationMonths - n(l.paid), 0), 0)
}

export function ublPolicy(s: UblState, basis: UblBasis): UblPolicy {
  const service = s.businessType === 'Service Provider'

  if (basis === 'ABB') {
    if (s.gstTurnover < 8_000_000) return { cap: 0, eligible: false, reason: 'GST turnover below ₹80 L policy minimum' }
    const cap = s.gstTurnover < 30_000_000 ? 2_500_000 : s.gstTurnover < 50_000_000 ? 3_500_000 : 5_000_000
    return { cap, eligible: true }
  }

  if (basis === 'GST') {
    return s.gstTurnover < 10_000_000
      ? { cap: 0, eligible: false, reason: 'GST turnover below ₹1 Cr policy minimum' }
      : { cap: 2_000_000, eligible: true }
  }

  if (basis === 'UNAUDITED') {
    const minTurnover = service ? 6_000_000 : 12_000_000
    if (s.gstTurnover < minTurnover) {
      return { cap: 0, eligible: false, reason: `Turnover below ₹${(minTurnover / 1e5).toFixed(0)} L policy minimum` }
    }
    return { cap: service ? 1_500_000 : 2_500_000, eligible: true }
  }

  // AUDITED
  const turnover = s.auditedIncome
  if (service) {
    if (turnover < 30_000_000) return { cap: 0, eligible: false, reason: 'Audited turnover below ₹3 Cr policy minimum' }
    return { cap: turnover < 50_000_000 ? 2_500_000 : turnover < 70_000_000 ? 5_000_000 : 7_500_000, eligible: true }
  }
  if (turnover < 50_000_000) return { cap: 0, eligible: false, reason: 'Audited turnover below ₹5 Cr policy minimum' }
  return { cap: turnover < 70_000_000 ? 2_500_000 : 5_000_000, eligible: true }
}

export function ublCalculate(s: UblState, basis: UblBasis): UblResult {
  const runningEmis = s.loans.reduce((sum, l) => sum + n(l.emi), 0)
  const obligation = ublObligation(s)
  let calculated = 0
  let driver = ''

  if (basis === 'ABB') {
    const emiCapacity = s.avgBanking * (s.abbCapacityPct / 100)
    calculated = Math.max(0, emiCapacity * s.tenure * (s.abbEligibilityPct / 100) - obligation)
    driver = `EMI capacity ₹${Math.round(emiCapacity).toLocaleString('en-IN')} × ${s.tenure} months, less balance obligations`
  } else if (basis === 'GST') {
    const margin = GST_MARGIN[s.businessType] ?? 7.5
    const yearlyFoir = s.gstTurnover * (margin / 100) * (s.gstFoirPct / 100)
    const monthlyCapacity = yearlyFoir / 12 - runningEmis
    calculated = Math.max(0, monthlyCapacity * s.tenure * (s.gstFoirPct / 100) - obligation)
    driver = `${margin}% margin policy × ${s.gstFoirPct}% FOIR, less running EMIs`
  } else if (basis === 'UNAUDITED') {
    const monthlyPat = s.pat / 12
    const multiplier = s.businessType === 'Service Provider' ? 1.75 : s.patMultiplier
    calculated = Math.max(0, (monthlyPat - runningEmis) * s.tenure * multiplier - obligation)
    driver = `Monthly PAT × ${multiplier}× policy factor, less balance obligations`
  } else {
    const totalRevenue = s.pat + s.depreciation + s.interestLoan + s.remuneration * (s.remunerationPct / 100) + s.capitalInterest
    const desiredEmi = ublMonthlyEmi(s.desiredLoan, s.rate, s.tenure)
    const totalObligation = runningEmis * 12 + desiredEmi
    calculated = Math.max(0, (totalRevenue - totalObligation) * s.auditedMultiplier)
    driver = `Revenue add-backs less annual EMI obligation × ${s.auditedMultiplier}× factor`
  }

  const policy = ublPolicy(s, basis)
  const finalEligibility = policy.eligible ? Math.min(calculated, policy.cap) : 0

  return {
    calculated,
    finalEligibility,
    policy,
    obligation,
    driver,
    requestedEmi: ublMonthlyEmi(s.desiredLoan, s.rate, s.tenure),
    eligibleEmi: ublMonthlyEmi(finalEligibility, s.rate, s.tenure),
  }
}
