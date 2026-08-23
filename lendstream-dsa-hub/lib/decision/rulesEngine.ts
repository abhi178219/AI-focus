import type { Band, DocumentRow, Lead, PillarCode, Product, Verdict } from '@/lib/types'

// The LLM (lib/ai/extractionPrompt.ts) only extracts structured fields from
// documents. This module computes the score/verdict deterministically from
// that structured data against per-product thresholds — lending decisions
// must be auditable and reproducible, not dependent on LLM reasoning that
// can vary run-to-run. See /decisions/2026-08-22-lendstream-dsa-hub-architecture.md.

export function bandFromScore(score: number): Band {
  if (score >= 80) return 'STRONG'
  if (score >= 65) return 'GOOD'
  if (score >= 50) return 'MODERATE'
  if (score >= 35) return 'WEAK'
  return 'CRITICAL'
}

function verdictFromBand(band: Band): Verdict {
  if (band === 'STRONG' || band === 'GOOD') return 'PASS'
  if (band === 'MODERATE') return 'REFER'
  return 'DECLINE'
}

export function calculateEmi(principal: number, annualRatePercent: number, tenureYears: number): number {
  const r = annualRatePercent / 12 / 100
  const n = Math.round(tenureYears * 12)
  if (r === 0 || n === 0) return n > 0 ? principal / n : 0
  const factor = Math.pow(1 + r, n)
  return (principal * r * factor) / (factor - 1)
}

export interface PillarResult {
  pillar_code: PillarCode
  score: number
  band: Band
  headline: string
  signals: string[]
  knockout: string | null
  applicable: boolean
}

function bureauPillar(lead: Lead): PillarResult {
  if (lead.cibil_score == null) {
    return { pillar_code: 'BUREAU', score: 0, band: 'CRITICAL', headline: 'No CIBIL score on file', signals: [], knockout: null, applicable: false }
  }
  const score = Math.max(0, Math.min(100, ((lead.cibil_score - 300) / (900 - 300)) * 100))
  const band = bandFromScore(score)
  const knockout = lead.cibil_score < 650 ? 'BUREAU_MIN_SCORE' : null
  return {
    pillar_code: 'BUREAU', score, band,
    headline: `CIBIL ${lead.cibil_score}`,
    signals: [`cibil_score=${lead.cibil_score}`],
    knockout, applicable: true,
  }
}

function bankingPillar(lead: Lead, documents: DocumentRow[], product: Product, proposedEmi: number): PillarResult {
  const bankDoc = documents.find((d) => d.type === 'BANK_STATEMENT' && d.extracted_json)
  const monthlyIncome = lead.monthly_income ?? (bankDoc?.extracted_json?.avg_monthly_balance as number | undefined) ?? null

  if (!monthlyIncome) {
    return { pillar_code: 'BANKING', score: 0, band: 'CRITICAL', headline: 'No income data available', signals: [], knockout: null, applicable: false }
  }

  const foirPercent = ((lead.existing_emis + proposedEmi) / monthlyIncome) * 100
  const score = Math.max(0, Math.min(100, 100 - foirPercent))
  const band = bandFromScore(score)
  const knockout = foirPercent > product.max_foir_percent ? 'FOIR_EXCEEDS_LIMIT' : null

  const signals = [`foir_percent=${foirPercent.toFixed(1)}`, `max_foir_percent=${product.max_foir_percent}`]
  if (bankDoc?.extracted_json?.salary_credits_detected === false) signals.push('no_regular_salary_credits_detected')

  return {
    pillar_code: 'BANKING', score, band,
    headline: `FOIR ${foirPercent.toFixed(1)}% (limit ${product.max_foir_percent}%)`,
    signals, knockout, applicable: true,
  }
}

function collateralPillar(lead: Lead, product: Product): PillarResult {
  const applicable = (lead.loan_type === 'HL' || lead.loan_type === 'LAP' || lead.loan_type === 'BOTH') && !!lead.property_value
  if (!applicable) {
    return { pillar_code: 'COLLATERAL', score: 0, band: 'CRITICAL', headline: 'Not applicable', signals: [], knockout: null, applicable: false }
  }
  const ltvPercent = (lead.requested_amount / lead.property_value!) * 100
  const score = Math.max(0, Math.min(100, 100 - ltvPercent))
  const band = bandFromScore(score)
  const maxLtv = product.max_ltv_percent ?? 90
  const knockout = ltvPercent > maxLtv ? 'LTV_EXCEEDS_LIMIT' : null
  return {
    pillar_code: 'COLLATERAL', score, band,
    headline: `LTV ${ltvPercent.toFixed(1)}% (limit ${maxLtv}%)`,
    signals: [`ltv_percent=${ltvPercent.toFixed(1)}`], knockout, applicable: true,
  }
}

function gstPillar(documents: DocumentRow[], product: Product): PillarResult {
  const gstDoc = documents.find((d) => d.type === 'GST_RETURNS' && d.extracted_json)
  const turnover = gstDoc?.extracted_json?.turnover as number | undefined
  if (!gstDoc || turnover == null) {
    return { pillar_code: 'GST', score: 0, band: 'CRITICAL', headline: 'Not applicable', signals: [], knockout: null, applicable: false }
  }
  const floor = (product.min_salary_required ?? 25000) * 12
  const ratio = turnover / floor
  const score = Math.max(0, Math.min(100, ratio * 50))
  const band = bandFromScore(score)
  const knockout = turnover < floor ? 'GST_TURNOVER_BELOW_FLOOR' : null
  return {
    pillar_code: 'GST', score, band,
    headline: `Turnover ₹${turnover.toLocaleString('en-IN')}`,
    signals: [`turnover=${turnover}`, `floor=${floor}`], knockout, applicable: true,
  }
}

export interface ComputedAssessment {
  composite_score: number
  composite_band: Band
  verdict: Verdict
  knockouts: string[]
  governing_capacity: number | null
  binding_constraint: string | null
  dscr: number | null
  dscr_band: Band | null
  proposed_emi: number
  recommendation: string
  watch_items: string[]
  pillars: PillarResult[]
}

export function computeAssessment(lead: Lead, documents: DocumentRow[], product: Product): ComputedAssessment {
  const avgRate = (product.min_interest_rate + product.max_interest_rate) / 2
  const tenure = lead.tenure_years ?? product.max_tenure_years
  const proposedEmi = calculateEmi(lead.requested_amount, avgRate, tenure)

  const allPillars = [
    bureauPillar(lead),
    bankingPillar(lead, documents, product, proposedEmi),
    collateralPillar(lead, product),
    gstPillar(documents, product),
  ]

  const applicablePillars = allPillars.filter((p) => p.applicable)
  const weights = product.pillar_weights ?? { BANKING: 25, BUREAU: 25, COLLATERAL: 25, GST: 25 }
  const totalWeight = applicablePillars.reduce((sum, p) => sum + (weights[p.pillar_code] ?? 0), 0) || 1
  const compositeScore = applicablePillars.reduce(
    (sum, p) => sum + p.score * ((weights[p.pillar_code] ?? 0) / totalWeight), 0,
  )
  const compositeBand = bandFromScore(compositeScore)

  const knockouts = allPillars.map((p) => p.knockout).filter((k): k is string => !!k)
  const verdict: Verdict = knockouts.length > 0 ? 'DECLINE' : verdictFromBand(compositeBand)

  const bindingPillar = [...applicablePillars].sort((a, b) => a.score - b.score)[0]
  const monthlyIncome = lead.monthly_income ?? 0
  const dscr = monthlyIncome > 0 ? monthlyIncome / (lead.existing_emis + proposedEmi) : null
  const dscrBand: Band | null = dscr != null
    ? (dscr >= 2 ? 'STRONG' : dscr >= 1.5 ? 'GOOD' : dscr >= 1.2 ? 'MODERATE' : dscr >= 1 ? 'WEAK' : 'CRITICAL')
    : null

  const maxEmiCapacity = monthlyIncome > 0 ? (monthlyIncome * product.max_foir_percent / 100) - lead.existing_emis : null
  const governingCapacity = maxEmiCapacity != null && maxEmiCapacity > 0
    ? reverseEmiToPrincipal(maxEmiCapacity, avgRate, tenure)
    : null

  const watchItems = applicablePillars
    .filter((p) => p.band === 'MODERATE' || p.band === 'WEAK')
    .map((p) => `${p.pillar_code}: ${p.headline}`)
  allPillars.filter((p) => !p.applicable).forEach((p) => watchItems.push(`${p.pillar_code}: insufficient data to assess`))

  const recommendation = verdict === 'DECLINE'
    ? `Decline — ${knockouts.join(', ') || 'composite score below threshold'}.`
    : verdict === 'REFER'
      ? `Refer for manual underwriting — composite ${compositeBand.toLowerCase()}, binding constraint: ${bindingPillar?.pillar_code ?? 'n/a'}.`
      : `Recommended for logging in — composite ${compositeBand.toLowerCase()}.`

  return {
    composite_score: Math.round(compositeScore * 10) / 10,
    composite_band: compositeBand,
    verdict,
    knockouts,
    governing_capacity: governingCapacity,
    binding_constraint: bindingPillar?.pillar_code ?? null,
    dscr: dscr != null ? Math.round(dscr * 100) / 100 : null,
    dscr_band: dscrBand,
    proposed_emi: Math.round(proposedEmi),
    recommendation,
    watch_items: watchItems,
    pillars: allPillars,
  }
}

export function reverseEmiToPrincipal(emi: number, annualRatePercent: number, tenureYears: number): number {
  const r = annualRatePercent / 12 / 100
  const n = Math.round(tenureYears * 12)
  if (r === 0 || n === 0) return emi * n
  const factor = Math.pow(1 + r, n)
  return (emi * (factor - 1)) / (r * factor)
}
