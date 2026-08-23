import type { DocumentRow, DocumentType, Band } from '@/lib/types'

/**
 * Quality factors — the banking, GST and counterparty signals that adjust how
 * much confidence the assessed capacity deserves, and the haircut that follows.
 *
 * Every factor is computed from a field that a parsed document actually
 * supplied. A factor whose input is absent is simply omitted — it is never
 * assumed favourable, and never invented.
 *
 * The haircut weights below are OUR policy, stated explicitly so a credit team
 * can see and retune them. They are not recovered from the reference prototype
 * (its weights aren't in its shipped code), so they are deliberately small and
 * additive rather than presented as a calibrated model.
 */

export type FactorEffect = 'Supports' | 'Reduces confidence' | 'Monitor' | 'Caps capacity'

export interface QualityFactor {
  label: string
  detail: string
  effect: FactorEffect
  band: Band
  /** Percentage points of haircut this factor contributes (0 when supportive). */
  haircutPercent: number
}

export interface QualityAssessment {
  factors: QualityFactor[]
  /** Total haircut, capped so a stack of small deductions can't gut capacity. */
  haircutPercent: number
}

const MAX_HAIRCUT_PERCENT = 15

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
function docOf(documents: DocumentRow[], type: DocumentType) {
  const d = documents.find((x) => x.type === type && x.status === 'verified' && x.extracted_json)
  return d ? (d.extracted_json as Record<string, unknown>) : null
}
function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : []
}

export function buildQualityFactors(documents: DocumentRow[]): QualityAssessment {
  const bank = docOf(documents, 'BANK_STATEMENT')
  const gst = docOf(documents, 'GST_RETURNS')
  const factors: QualityFactor[] = []

  if (bank) {
    // Payer concentration — one dominant payer is a real dependency risk.
    const inflows = arr(bank.top_inflows)
    const topIn = inflows[0]
    const topInShare = topIn ? num(topIn.share_percent) : null
    const topFiveShare = inflows.slice(0, 5).reduce((s, r) => s + (num(r.share_percent) ?? 0), 0)
    if (topInShare !== null) {
      const heavy = topInShare >= 35
      factors.push({
        label: 'Payer concentration',
        detail: `${str(topIn.name) ?? 'Top payer'} is ${topInShare.toFixed(0)}% of receipts${
          topFiveShare > 0 ? `; top five are ${Math.min(100, topFiveShare).toFixed(0)}%` : ''
        }.`,
        effect: heavy ? 'Monitor' : 'Supports',
        band: topInShare >= 50 ? 'WEAK' : heavy ? 'MODERATE' : 'STRONG',
        haircutPercent: topInShare >= 50 ? 2 : heavy ? 1 : 0,
      })
    }

    // Cash intensity — cash-heavy receipts are harder for a lender to verify.
    const cashPct = num(bank.cash_deposit_percent)
    if (cashPct !== null) {
      const heavy = cashPct >= 20
      factors.push({
        label: 'Cash intensity',
        detail: `${cashPct.toFixed(0)}% of credits are cash deposits.`,
        effect: heavy ? 'Reduces confidence' : 'Supports',
        band: cashPct >= 40 ? 'WEAK' : heavy ? 'MODERATE' : 'STRONG',
        haircutPercent: cashPct >= 40 ? 3 : heavy ? 2 : 0,
      })
    }

    // Non-business credits inflate turnover if left in.
    const nonBusiness = arr(bank.credit_categories)
      .filter((c) => /loan|transfer|inter-?account|disbursement/i.test(str(c.label) ?? ''))
      .reduce((s, c) => s + (num(c.share_percent) ?? 0), 0)
    if (nonBusiness > 0) {
      factors.push({
        label: 'Non-business credits',
        detail: `${nonBusiness.toFixed(0)}% of credits are loan disbursements or inter-account transfers, excluded from assessed turnover.`,
        effect: 'Monitor',
        band: nonBusiness >= 15 ? 'WEAK' : nonBusiness >= 5 ? 'MODERATE' : 'GOOD',
        haircutPercent: nonBusiness >= 15 ? 2 : nonBusiness >= 5 ? 1 : 0,
      })
    }

    // Banking conduct — returns are the clearest negative signal in a statement.
    const bounces = num(bank.total_bounces)
    if (bounces !== null) {
      factors.push({
        label: 'Banking conduct',
        detail: bounces === 0
          ? 'No cheque returns across the statement period.'
          : `${bounces} cheque return${bounces === 1 ? '' : 's'} across the statement period.`,
        effect: bounces === 0 ? 'Supports' : 'Reduces confidence',
        band: bounces === 0 ? 'STRONG' : bounces <= 2 ? 'MODERATE' : 'WEAK',
        haircutPercent: bounces === 0 ? 0 : bounces <= 2 ? 2 : 4,
      })
    }

    // Supplier concentration.
    const outflows = arr(bank.top_outflows)
    const topOut = outflows[0]
    const topOutShare = topOut ? num(topOut.share_percent) : null
    if (topOutShare !== null) {
      factors.push({
        label: 'Supplier concentration',
        detail: `${str(topOut.name) ?? 'Top supplier'} takes ${topOutShare.toFixed(0)}% of supplier payments.`,
        effect: topOutShare >= 40 ? 'Monitor' : 'Supports',
        band: topOutShare >= 55 ? 'WEAK' : topOutShare >= 40 ? 'MODERATE' : 'STRONG',
        haircutPercent: topOutShare >= 55 ? 1 : 0,
      })
    }
  }

  if (gst) {
    // Filing discipline caps capacity rather than haircutting it — an unfiled
    // return is a condition to clear, not a permanent reduction.
    const due = num(gst.returns_due)
    const filed = num(gst.returns_filed)
    if (due !== null && filed !== null) {
      const missed = Math.max(0, due - filed)
      factors.push({
        label: 'GST filing discipline',
        detail: missed === 0
          ? `All ${due} returns filed in the period.`
          : `${missed} return${missed === 1 ? '' : 's'} unfiled in the last twelve months.`,
        effect: missed === 0 ? 'Supports' : 'Caps capacity',
        band: missed === 0 ? 'STRONG' : missed <= 2 ? 'MODERATE' : 'WEAK',
        haircutPercent: 0,
      })
    }

    // Turnover volatility from the real monthly series.
    const months = arr(gst.monthly_turnover).map((m) => num(m.taxable_value)).filter((v): v is number => v !== null)
    if (months.length >= 3) {
      const mean = months.reduce((s, v) => s + v, 0) / months.length
      const sd = Math.sqrt(months.reduce((s, v) => s + (v - mean) ** 2, 0) / months.length)
      const cov = mean ? (sd / mean) * 100 : 0
      const volatile = cov >= 35
      factors.push({
        label: 'Turnover volatility',
        detail: `${cov.toFixed(0)}% coefficient of variation across ${months.length} periods.`,
        effect: volatile ? 'Reduces confidence' : 'Supports',
        band: cov >= 50 ? 'WEAK' : volatile ? 'MODERATE' : 'STRONG',
        haircutPercent: cov >= 50 ? 3 : volatile ? 2 : 0,
      })
    }
  }

  const haircutPercent = Math.min(
    MAX_HAIRCUT_PERCENT,
    factors.reduce((s, f) => s + f.haircutPercent, 0),
  )

  return { factors, haircutPercent }
}
