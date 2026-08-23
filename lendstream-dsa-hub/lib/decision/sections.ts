import type { Band, DocumentRow, DocumentType, Lead } from '@/lib/types'
import {
  BUREAU_POLICY, BUSINESS_POLICY, COLLATERAL_POLICY, GST_MARGINS, GST_POLICY,
  STOCK_DEFAULT_MARGIN_PERCENT,
} from '@/lib/decision/policy'

/**
 * Builds the per-section view of a file — the prototype's "Section snapshot"
 * and its Banking / GST / Bureau / Financials / Business / Stock / Collateral tabs.
 *
 * Every value here comes from a real parsed document or a real lead field.
 * When the backing document has not been uploaded (or hasn't been parsed yet)
 * the section reports `status: 'missing'` and the UI shows an empty state
 * naming the document needed — it never fabricates a plausible-looking figure.
 *
 * The prototype SYNTHESISES its numbers from a seeded PRNG. We deliberately do
 * not: we mirror its STRUCTURE and LABELS exactly, and any field the parsed
 * document did not carry renders as "—".
 */

export type SectionCode =
  | 'BANKING' | 'GST' | 'BUREAU' | 'FINANCIALS' | 'BUSINESS' | 'STOCK' | 'COLLATERAL'

export interface SectionMetric {
  label: string
  /** null renders as "—" — the value genuinely isn't on file. */
  value: string | null
}

/** Large call-out figure at the top of a section tab. */
export interface SectionHero {
  label: string
  value: string | null
  sub?: string | null
  /** Colours the figure when the value carries a policy read. */
  band?: Band | null
}

/** Optional row-level detail (e.g. a month-by-month statement breakdown). */
export interface SectionTable {
  title: string
  sub?: string
  columns: string[]
  rows: (string | null)[][]
  /** Shown in place of rows when the parse yielded none. */
  emptyText?: string
  /** Row indices rendered as totals / emphasised heads. */
  emphasise?: number[]
}

/** Grouped key/value facts (account details, facility terms, …). */
export interface SectionPanelGroup {
  title: string
  sub?: string
  items: { label: string; value: string | null; emphasis?: boolean }[]
}

/** One "signal" row: a labelled read with its own band, as in the prototype. */
export interface SectionSignal {
  label: string
  value: string | null
  band: Band | null
  note?: string
}

export interface SectionSignalGroup {
  title: string
  sub?: string
  rows: SectionSignal[]
}

/** Ranked concentration list — payers, suppliers, counterparties. */
export interface SectionRankedRow {
  name: string
  sub: string | null
  value: string | null
  sharePercent: number | null
  band: Band | null
}

export interface SectionRankedList {
  title: string
  sub?: string
  rows: SectionRankedRow[]
}

/** "Every rupee classified" — a labelled share-of-total breakdown. */
export interface SectionBreakdownRow {
  label: string
  sub?: string | null
  value: string | null
  sharePercent: number | null
  note?: string
}

export interface SectionBreakdown {
  title: string
  sub?: string
  rows: SectionBreakdownRow[]
  total?: { label: string; value: string | null }
}

/** Small bar chart — GST turnover trend, three-year revenue trend. */
export interface SectionTrend {
  title: string
  sub?: string
  right?: { text: string; band: Band } | null
  points: { label: string; value: number | null; display: string | null }[]
  /** Sparse axis captions under the bars (the prototype shows M1 / M6 / M12). */
  axis?: string[]
  tiles?: SectionHero[]
}

/** A single proportion bar with an optional policy cap marker. */
export interface SectionMeter {
  title: string
  sub?: string
  headline?: { label: string; value: string | null }
  fillPercent: number | null
  /** Second segment drawn beyond the fill (e.g. an existing charge). */
  overlayPercent?: number | null
  /** Policy cap marker. */
  capPercent?: number | null
  fillLabel?: string | null
  capLabel?: string | null
  band?: Band | null
  legend?: { label: string; kind: 'fill' | 'overlay' | 'cap' }[]
  axis?: string[]
  note?: string
  alert?: { band: Band; text: string }
  tiles?: SectionHero[]
}

/** A benchmark grid — the Financials tab's ratio analysis. */
export interface SectionRatioGrid {
  title: string
  sub?: string
  items: { label: string; value: string | null; benchmark: string; ok: boolean | null }[]
}

export interface SectionKnockout { code: string; label: string; detail: string }

export interface SectionCapacity { label: string; value: string | null; basis: string | null }

/** Prose read with an optional badge (e.g. the recommended facility structure). */
export interface SectionProse { title: string; sub?: string; badge?: string | null; text: string }

/** Band-only readout panel (the Bureau tab's "Behaviour" card). */
export interface SectionBandPanel {
  title: string
  items: { label: string; band: Band | null }[]
  metrics?: { label: string; value: string | null }[]
}

export interface SectionNotes { title: string; sub?: string; items: string[] }

export interface SectionChips { title: string; band: Band; items: string[] }

export interface SectionView {
  key: SectionCode
  label: string
  /** Which document supplies this section, for the empty-state prompt. */
  sourceType: DocumentType | null
  sourceLabel: string
  status: 'ready' | 'missing'
  band: Band | null
  headline: string
  /** Compact 4-up figures shown on the Overview snapshot card. */
  metrics: SectionMetric[]
  /** Richer detail, rendered only on the section's own tab. */
  hero?: SectionHero[]
  /** A second tile row introducing the ranked lists below it. */
  subHero?: SectionHero[]
  tables?: SectionTable[]
  panels?: SectionPanelGroup[]
  signals?: SectionSignalGroup
  ranked?: SectionRankedList[]
  breakdowns?: SectionBreakdown[]
  trend?: SectionTrend
  meter?: SectionMeter
  ratios?: SectionRatioGrid
  capacity?: SectionCapacity
  knockouts?: SectionKnockout[]
  prose?: SectionProse[]
  bandPanels?: SectionBandPanel[]
  notes?: SectionNotes
  chips?: SectionChips
  /** Plain-language read on how this section behaves. */
  conduct?: { title: string; band: Band; text: string }
}

/* ------------------------------------------------------------------ format */

/** Same ladder as lib/format.ts — Cr above a crore, L above a lakh, else rupees. */
function money(n: number | null): string | null {
  if (n === null || !Number.isFinite(n)) return null
  const a = Math.abs(n)
  if (a >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (a >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}
const fmtCr = (n: number) => n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(2)} L`
const fmtL = (n: number) => `₹${(n / 1e5).toFixed(2)} L`
const fmtK = (n: number) => n >= 1e5 ? fmtL(n) : `₹${Math.round(n / 1000)}k`
const pct = (n: number) => `${Math.round(n)}%`
const pct1 = (n: number) => `${n.toFixed(1)}%`
const pct0 = (n: number | null) => n === null ? null : `${n.toFixed(0)}%`

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}
function bool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}
function arr(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : []
}
function numList(v: unknown): number[] {
  return Array.isArray(v) ? (v as unknown[]).map(num).filter((n): n is number => n !== null) : []
}
/** Reads a lead column that may not exist in the checked-in Lead type yet. */
function leadField(lead: Lead, key: string): unknown {
  return (lead as unknown as Record<string, unknown>)[key]
}
function titleCase(v: string | null): string | null {
  if (!v) return null
  const t = v.replace(/_/g, ' ').toLowerCase()
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null
}
function stddev(xs: number[]): number | null {
  if (xs.length < 2) return null
  const m = mean(xs)!
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length)
}
/** Sparse axis captions — first, middle and last point, as the prototype shows. */
function sparseAxis(labels: (string | null)[]): string[] {
  const clean = labels.map((l, i) => l ?? `M${i + 1}`)
  if (clean.length < 3) return clean
  return [clean[0], clean[Math.floor((clean.length - 1) / 2)], clean[clean.length - 1]]
}

/** Latest verified document of a type, with its extracted payload. */
function docOf(documents: DocumentRow[], type: DocumentType) {
  const d = documents.find((x) => x.type === type && x.status === 'verified' && x.extracted_json)
  return d ? { doc: d, data: d.extracted_json as Record<string, unknown> } : null
}

function bandFromScore(score: number): Band {
  if (score >= 85) return 'STRONG'
  if (score >= 70) return 'GOOD'
  if (score >= 55) return 'MODERATE'
  if (score >= 40) return 'WEAK'
  return 'CRITICAL'
}

/** True when the file is a secured product — changes several policy floors. */
function isSecured(lead: Lead): boolean {
  return lead.loan_type === 'HL' || lead.loan_type === 'LAP' || lead.loan_type === 'BOTH'
}

export function buildSections(lead: Lead, documents: DocumentRow[]): SectionView[] {
  return [
    banking(lead, documents),
    gst(lead, documents),
    bureau(lead, documents),
    financials(lead, documents),
    business(lead, documents),
    stock(lead, documents),
    collateral(lead, documents),
  ]
}

function missing(
  key: SectionCode, label: string, sourceType: DocumentType | null, sourceLabel: string, metrics: string[],
): SectionView {
  return {
    key, label, sourceType, sourceLabel, status: 'missing', band: null,
    headline: `${sourceLabel} not on file yet`,
    metrics: metrics.map((m) => ({ label: m, value: null })),
  }
}

/* ----------------------------------------------------------------- banking */

/** Counterparty rows read off the statement narrations, highest share first. */
function counterparties(raw: unknown, tone: 'in' | 'out'): SectionRankedRow[] {
  return arr(raw)
    .map((c) => {
      const name = str(c.name)
      if (!name) return null
      const share = num(c.share_percent)
      const txns = num(c.txn_count)
      const last = str(c.last_seen)
      const recurring = bool(c.recurring)
      const subParts = [
        txns !== null ? `${txns} txns` : null,
        last ? `last ${last}` : null,
        recurring ? 'recurring' : null,
      ].filter(Boolean)
      return {
        name,
        sub: subParts.length ? subParts.join(' · ') : null,
        value: money(num(c.amount)),
        sharePercent: share,
        band: share === null ? null
          : tone === 'in'
            ? (share >= 40 ? 'CRITICAL' : share >= 25 ? 'MODERATE' : 'GOOD')
            : 'GOOD',
      } as SectionRankedRow
    })
    .filter((r): r is SectionRankedRow => r !== null)
}

function categoryRows(raw: unknown): SectionBreakdownRow[] {
  return arr(raw)
    .map((c) => {
      const label = str(c.label) ?? titleCase(str(c.key))
      if (!label) return null
      return { label, value: money(num(c.amount)), sharePercent: num(c.share_percent) } as SectionBreakdownRow
    })
    .filter((r): r is SectionBreakdownRow => r !== null)
}

function categoryShare(raw: unknown, keys: string[]): number | null {
  const rows = arr(raw).filter((c) => keys.includes(String(c.key ?? '').toUpperCase()))
  if (!rows.length) return null
  const shares = rows.map((c) => num(c.share_percent)).filter((n): n is number => n !== null)
  return shares.length ? shares.reduce((s, x) => s + x, 0) : null
}
function categoryAmount(raw: unknown, keys: string[]): number | null {
  const rows = arr(raw).filter((c) => keys.includes(String(c.key ?? '').toUpperCase()))
  if (!rows.length) return null
  const amounts = rows.map((c) => num(c.amount)).filter((n): n is number => n !== null)
  return amounts.length ? amounts.reduce((s, x) => s + x, 0) : null
}

function banking(lead: Lead, documents: DocumentRow[]): SectionView {
  const src = docOf(documents, 'BANK_STATEMENT')
  const labels = ['Avg balance', 'Credits 12m', 'Salary credits', 'Bank']
  if (!src) return missing('BANKING', 'Banking', 'BANK_STATEMENT', 'Bank statement', labels)

  const avg = num(src.data.avg_monthly_balance)
  const credits = numList(src.data.monthly_credits)
  const totalCredits = credits.length ? credits.reduce((s, c) => s + c, 0) : null
  const bankName = str(src.data.bank_name)
  const salaryDetected = bool(src.data.salary_credits_detected)

  // Banked against the lead's own obligations — a real ratio, not a guess.
  const emiCover = avg && lead.existing_emis > 0 ? avg / lead.existing_emis : null
  const band: Band | null = emiCover === null ? null
    : emiCover >= 6 ? 'STRONG' : emiCover >= 3 ? 'GOOD' : emiCover >= 1.5 ? 'MODERATE' : 'WEAK'

  const debits = numList(src.data.monthly_debits)
  const totalDebits = debits.length ? debits.reduce((s, d) => s + d, 0) : null
  const netSurplus = totalCredits !== null && totalDebits !== null ? totalCredits - totalDebits : null
  const bounces = num(src.data.total_bounces)
  const cashPct = num(src.data.cash_deposit_percent)
  const odLimit = num(src.data.od_sanctioned_limit)
  const odUtil = num(src.data.od_utilisation_percent)
  const vintageMonths = num(src.data.account_vintage_months)
  const aaVerified = bool(src.data.aa_verified)

  const monthRows = arr(src.data.months).map((m) => ([
    str(m.month),
    money(num(m.credits)),
    money(num(m.debits)),
    money(num(m.closing_balance)),
    money(num(m.abb)),
    money(num(m.min_balance)),
    num(m.bounces) !== null ? String(num(m.bounces)) : '—',
  ]))

  const conductBand: Band | null = bounces === null ? band
    : bounces === 0 ? 'STRONG' : bounces <= 2 ? 'MODERATE' : 'WEAK'

  // ---- Counterparty concentration -----------------------------------------
  const inflows = counterparties(src.data.top_inflows, 'in')
  const outflows = counterparties(src.data.top_outflows, 'out')
  const topPayer = inflows[0]?.sharePercent ?? null
  const topFivePayer = inflows.slice(0, 5).every((r) => r.sharePercent === null)
    ? null
    : inflows.slice(0, 5).reduce((s, r) => s + (r.sharePercent ?? 0), 0)
  const topSupplier = outflows[0]?.sharePercent ?? null
  const netBusinessReceipts = categoryAmount(src.data.credit_categories, ['BUSINESS_RECEIPTS', 'CASH_DEPOSIT'])
  const nonBusinessPct = categoryShare(src.data.credit_categories, ['LOAN_CREDIT', 'INTER_ACCOUNT'])
  const emiShare = categoryShare(src.data.debit_categories, ['LOAN_EMI'])
  const statutoryShare = categoryShare(src.data.debit_categories, ['STATUTORY'])

  const concentrationBand = (share: number | null): Band | null =>
    share === null ? null : share >= 55 ? 'CRITICAL' : share >= 40 ? 'WEAK' : share >= 25 ? 'MODERATE' : 'STRONG'

  // Observations are rule-based reads of the real figures above — never a
  // narrative invented to fill space. Each is emitted only when its input exists.
  const observations: string[] = []
  if (topPayer !== null && inflows[0]) {
    observations.push(topPayer >= 40
      ? `${inflows[0].name} alone accounts for ${topPayer.toFixed(0)}% of receipts. Losing this one relationship would materially change the file.`
      : `Receipts are reasonably spread — the largest payer is ${topPayer.toFixed(0)}% of the book.`)
  }
  if (topFivePayer !== null && topFivePayer >= 80) {
    observations.push(`Top five payers are ${topFivePayer.toFixed(0)}% of receipts — a narrow customer base.`)
  }
  if (cashPct !== null && cashPct > 25) {
    observations.push(`Cash deposits are ${cashPct.toFixed(0)}% of credits. Lenders typically haircut cash-heavy turnover, and it should reconcile to GST.`)
  }
  if (nonBusinessPct !== null && nonBusinessPct > 8) {
    observations.push(`${nonBusinessPct.toFixed(0)}% of credits are loan disbursements or inter-account transfers — excluded from assessed turnover to avoid inflating it.`)
  }
  if (topSupplier !== null && topSupplier >= 40 && outflows[0]) {
    observations.push(`Supply is concentrated: ${outflows[0].name} takes ${topSupplier.toFixed(0)}% of supplier payments. Check whether alternate sourcing exists.`)
  }
  if (emiShare !== null && emiShare > 20) {
    observations.push(`EMIs consume ${emiShare.toFixed(0)}% of outflows — servicing load is already heavy before this facility.`)
  }
  if (statutoryShare !== null && statutoryShare < 3.5) {
    observations.push('Statutory outflow looks light against declared turnover — worth reconciling with the GST returns.')
  }

  const inflowCats = categoryRows(src.data.credit_categories)
  const outflowCats = categoryRows(src.data.debit_categories)
  const hasCounterparties = inflows.length > 0 || outflows.length > 0

  return {
    key: 'BANKING', label: 'Banking', sourceType: 'BANK_STATEMENT', sourceLabel: 'Bank statement',
    status: 'ready', band,
    headline: [bankName, str(src.data.account_type)].filter(Boolean).join(' · ') || 'Statement parsed',
    metrics: [
      { label: 'Avg balance', value: avg !== null ? fmtK(avg) : null },
      { label: 'Credits 12m', value: totalCredits !== null ? fmtCr(totalCredits) : null },
      { label: 'Bounces', value: bounces !== null ? String(bounces) : null },
      { label: 'Cash %', value: cashPct !== null ? pct(cashPct) : null },
    ],
    hero: [
      { label: 'Average balance', value: money(avg), sub: 'Statement-period ABB' },
      { label: 'Total credits', value: money(totalCredits), sub: credits.length ? `${credits.length} months` : null },
      { label: 'Net surplus', value: money(netSurplus), sub: 'Credits less debits', band: netSurplus === null ? null : netSurplus > 0 ? 'STRONG' : 'CRITICAL' },
      { label: 'Bounces', value: bounces !== null ? String(bounces) : null, sub: 'Returns in period', band: conductBand },
      { label: 'Cash deposits', value: cashPct !== null ? pct(cashPct) : null, sub: 'Of total credits', band: cashPct === null ? null : cashPct > 25 ? 'WEAK' : 'STRONG' },
    ],
    // The statement sections below always render, even when the parse yielded
    // nothing for them. Hiding a card when its data is missing makes the tab
    // change shape file-to-file and hides the fact that a figure was expected;
    // an empty card with an honest line tells the user what to go and get.
    tables: [{
      title: 'Month-by-month statement analysis',
      sub: 'Credits, debits, closing balance and returns',
      columns: ['Month', 'Credits', 'Debits', 'Closing', 'ABB', 'Min bal', 'Bounces'],
      rows: monthRows,
      emptyText: 'The parsed statement did not include a month-by-month breakdown.',
    }],
    panels: [
      {
        title: 'Account',
        sub: aaVerified === null ? undefined : aaVerified ? 'Verified via Account Aggregator' : 'Statement uploaded manually',
        items: [
          { label: 'Bank', value: bankName },
          { label: 'Account number', value: str(src.data.account_number) },
          { label: 'IFSC · branch', value: [str(src.data.ifsc), str(src.data.branch)].filter(Boolean).join(' · ') || null },
          { label: 'Account type', value: str(src.data.account_type) },
          { label: 'Relationship', value: vintageMonths !== null ? `${vintageMonths} months` : null },
          { label: 'Salary credits', value: salaryDetected === null ? null : salaryDetected ? 'Detected' : 'None detected' },
        ],
      },
      ...(odLimit !== null || odUtil !== null
        ? [{
            title: 'Overdraft facility',
            items: [
              { label: 'Sanctioned limit', value: money(odLimit) },
              { label: 'Utilisation', value: odUtil !== null ? pct(odUtil) : null },
            ],
          }]
        : []),
    ],
    subHero: [
          { label: 'Top payer', value: pct0(topPayer), sub: inflows[0]?.name ?? null, band: concentrationBand(topPayer) },
          { label: 'Top 5 payers', value: pct0(topFivePayer), sub: 'Of business receipts', band: topFivePayer === null ? null : topFivePayer >= 80 ? 'WEAK' : 'GOOD' },
          { label: 'Top supplier', value: pct0(topSupplier), sub: outflows[0]?.name ?? null, band: concentrationBand(topSupplier) },
      { label: 'Net business receipts', value: money(netBusinessReceipts), sub: nonBusinessPct !== null ? `${nonBusinessPct.toFixed(0)}% excluded as non-business` : null },
    ],
    ranked: [
      { title: 'Money received from', sub: 'Largest payers over the statement period', rows: inflows },
      { title: 'Money paid to', sub: 'Largest suppliers and vendors', rows: outflows },
    ],
    breakdowns: [
      { title: 'Where credits came from', sub: 'Every rupee classified', rows: inflowCats },
      { title: 'Where debits went', sub: 'Every rupee classified', rows: outflowCats },
    ],
    notes: observations.length
      ? { title: 'What the statement says', sub: 'Read across counterparties, categories and conduct', items: observations }
      : undefined,
    conduct: conductBand
      ? {
          title: 'Banking conduct',
          band: conductBand,
          text: bounces === null
            ? 'Returns not reported in the parsed statement.'
            : bounces === 0
              ? 'No returns across the statement period. Balance never breached the minimum.'
              : `${bounces} return${bounces === 1 ? '' : 's'} across the statement period — lenders will ask for the reason on each.`,
        }
      : undefined,
  }
}

/* --------------------------------------------------------------------- GST */

function gst(lead: Lead, documents: DocumentRow[]): SectionView {
  const src = docOf(documents, 'GST_RETURNS')
  const labels = ['Turnover', 'GSTIN', 'Filing month', 'Monthly avg']
  if (!src) return missing('GST', 'GST', 'GST_RETURNS', 'GST returns', labels)

  const gstin = str(src.data.gstin)
  const filingMonth = str(src.data.filing_month)
  const filingFrequency = str(src.data.filing_frequency)
  const businessType = str(src.data.business_type)?.toUpperCase().replace(/\s+/g, '_') ?? null

  const monthly = arr(src.data.monthly_turnover)
  const monthlyValues = monthly.map((m) => num(m.taxable_value))
  const present = monthlyValues.filter((v): v is number => v !== null)
  const summed = present.length ? present.reduce((s, v) => s + v, 0) : null
  // Prefer a stated annual turnover; otherwise sum the periods we actually have.
  const turnover = num(src.data.turnover) ?? summed
  const priorYear = num(src.data.prior_year_turnover)
  const avgMonthly = mean(present)
  const sd = stddev(present)
  const volatility = sd !== null && avgMonthly ? (sd / avgMonthly) * 100 : null
  const seasonal = volatility === null ? null : volatility > GST_POLICY.volatilityWarnPercent
  const yoy = turnover !== null && priorYear !== null && priorYear > 0
    ? ((turnover - priorYear) / priorYear) * 100 : null

  const returnsDue = num(src.data.returns_due)
  const returnsFiled = num(src.data.returns_filed)
  const lateFilings = num(src.data.late_filings)
  const missed = returnsDue !== null && returnsFiled !== null ? Math.max(0, returnsDue - returnsFiled) : null
  const filingCompliance = returnsDue !== null && returnsFiled !== null && returnsDue > 0
    ? (returnsFiled / returnsDue) * 100 : null
  const onTime = returnsFiled !== null && lateFilings !== null && returnsFiled > 0
    ? ((returnsFiled - lateFilings) / returnsFiled) * 100 : null

  const taxPaid = num(src.data.tax_paid)
  const itcClaimed = num(src.data.itc_claimed)
  const effectiveTaxRate = taxPaid !== null && turnover ? (taxPaid / turnover) * 100 : null

  const topOne = num(src.data.top_counterparty_percent)
  const topFive = num(src.data.top_five_counterparty_percent)
  const concentration: Band | null = topOne === null ? null
    : topOne >= GST_POLICY.concentrationCriticalPercent ? 'CRITICAL'
    : topOne >= GST_POLICY.concentrationWarnPercent ? 'WEAK'
    : topOne >= 25 ? 'MODERATE' : 'STRONG'

  // Assessed margin: the programme's own grid applied to real turnover.
  const marginRate = businessType ? GST_MARGINS[businessType] ?? null : null
  const marginPercent = marginRate !== null ? marginRate * 100 : null
  const marginIncome = marginRate !== null && turnover !== null ? turnover * marginRate : null
  const cap = turnover !== null ? GST_POLICY.caps.find((c) => turnover <= c.upTo)?.cap ?? null : null
  const impliedCapacity = marginIncome !== null
    ? (isSecured(lead) || cap === null
        ? marginIncome * GST_POLICY.foirOnMargin
        : Math.min(marginIncome * GST_POLICY.foirOnMargin, cap))
    : null

  const band: Band | null = turnover === null ? null
    : turnover >= 5e7 ? 'STRONG' : turnover >= 1e7 ? 'GOOD' : turnover >= 4e6 ? 'MODERATE' : 'WEAK'

  const knockouts: SectionKnockout[] = []
  if (turnover !== null && turnover < GST_POLICY.minAnnualTurnover) {
    knockouts.push({
      code: 'GST_MIN_TURNOVER', label: 'Turnover below programme minimum',
      detail: `${money(turnover)} against a ${money(GST_POLICY.minAnnualTurnover)} floor.`,
    })
  }
  if (missed !== null && missed > GST_POLICY.maxMissedFilings) {
    knockouts.push({
      code: 'GST_FILING_GAPS', label: 'Return filing gaps',
      detail: `${missed} returns unfiled in the period (limit ${GST_POLICY.maxMissedFilings}).`,
    })
  }

  return {
    key: 'GST', label: 'GST', sourceType: 'GST_RETURNS', sourceLabel: 'GST returns',
    status: 'ready', band,
    headline: knockouts.length
      ? 'Fails GST programme gate'
      : [
          turnover !== null ? `${money(turnover)} turnover` : null,
          yoy === null ? null : yoy >= 0 ? 'growing' : 'declining',
          missed === null ? null : missed === 0 ? 'filings current' : 'filing gaps present',
        ].filter(Boolean).join(', ') || 'Returns parsed',
    metrics: [
      { label: 'Turnover', value: turnover !== null ? fmtCr(turnover) : null },
      { label: 'GSTIN', value: gstin },
      { label: 'Filing month', value: filingMonth },
      { label: 'Monthly avg', value: avgMonthly !== null ? fmtK(avgMonthly) : turnover !== null ? fmtK(turnover / 12) : null },
    ],
    trend: {
      title: 'Turnover',
      sub: filingFrequency ? `GSTR-3B · ${titleCase(filingFrequency)?.toLowerCase()} filer` : 'GSTR-3B periods on file',
      right: yoy === null ? null : { text: `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}% YoY`, band: yoy >= 0 ? 'STRONG' : 'CRITICAL' },
      points: monthly.map((m, i) => ({
        label: str(m.month) ?? `M${i + 1}`,
        value: monthlyValues[i],
        display: money(monthlyValues[i]),
      })),
      axis: monthly.length ? sparseAxis(monthly.map((m) => str(m.month))) : undefined,
      tiles: [
        { label: 'Annual', value: money(turnover) },
        { label: 'Monthly avg', value: money(avgMonthly) },
        {
          label: 'Volatility', value: volatility === null ? null : `${volatility.toFixed(0)}%`,
          sub: seasonal === null ? null : seasonal ? 'Seasonal' : 'Stable',
          band: volatility === null ? null : volatility > GST_POLICY.volatilityWarnPercent ? 'WEAK' : 'STRONG',
        },
        {
          label: 'Filed', value: filingCompliance === null ? null : `${filingCompliance.toFixed(0)}%`,
          sub: missed === null ? null : `${missed} missed`,
          band: missed === null ? null : missed === 0 ? 'STRONG' : 'WEAK',
        },
      ],
    },
    signals: {
      title: 'Signals',
      rows: [
        {
          label: 'Turnover on file', value: money(turnover),
          band: turnover === null ? null : turnover >= GST_POLICY.minAnnualTurnover ? 'STRONG' : 'CRITICAL',
        },
        {
          label: 'YoY growth', value: yoy === null ? null : `${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`,
          band: yoy === null ? null : yoy >= 10 ? 'STRONG' : yoy >= 0 ? 'GOOD' : yoy >= -10 ? 'MODERATE' : 'WEAK',
          note: priorYear !== null ? `Prior year ${money(priorYear)}` : undefined,
        },
        {
          label: 'Filing compliance',
          value: filingCompliance === null ? null
            : `${filingCompliance.toFixed(0)}% filed${onTime !== null ? ` · ${onTime.toFixed(0)}% on time` : ''}`,
          band: missed === null ? null
            : missed === 0 && (lateFilings ?? 0) <= 1 ? 'STRONG'
            : missed === 0 ? 'GOOD' : missed <= 2 ? 'MODERATE' : 'CRITICAL',
          note: missed !== null && missed > 0 ? `${missed} returns unfiled` : undefined,
        },
        {
          label: 'Turnover volatility', value: volatility === null ? null : `${volatility.toFixed(0)}% CoV`,
          band: volatility === null ? null
            : volatility < 20 ? 'STRONG'
            : volatility < GST_POLICY.volatilityWarnPercent ? 'GOOD'
            : volatility < GST_POLICY.volatilityCriticalPercent ? 'MODERATE' : 'WEAK',
          note: seasonal ? 'Seasonal pattern — size limits on peak, not average' : undefined,
        },
        {
          label: 'Assessed margin',
          value: marginPercent === null ? null : `${marginPercent.toFixed(1)}%${marginIncome !== null ? ` → ${money(marginIncome)}` : ''}`,
          band: marginPercent === null ? null : 'GOOD',
          note: businessType ? `${businessType.replace(/_/g, ' ').toLowerCase()} grid` : undefined,
        },
        {
          label: 'Buyer concentration',
          value: topOne === null && topFive === null ? null
            : `${topOne !== null ? `Top 1: ${topOne.toFixed(0)}%` : 'Top 1: —'}${topFive !== null ? ` · Top 5: ${topFive.toFixed(0)}%` : ''}`,
          band: concentration,
          note: concentration === 'CRITICAL' || concentration === 'WEAK'
            ? 'Single-buyer dependence is a real receivables risk' : undefined,
        },
        {
          label: 'Effective tax rate',
          value: effectiveTaxRate === null ? null : `${effectiveTaxRate.toFixed(2)}% of turnover`,
          band: effectiveTaxRate === null ? null : 'MODERATE',
          note: itcClaimed !== null ? `ITC claimed ${money(itcClaimed)}` : undefined,
        },
      ],
    },
    capacity: {
      label: 'Implied capacity',
      value: money(impliedCapacity),
      basis: impliedCapacity === null
        ? 'Needs a declared turnover and a business type to apply the margin grid.'
        : isSecured(lead) || cap === null
          ? `${marginPercent!.toFixed(1)}% margin × ${GST_POLICY.foirOnMargin * 100}% FOIR. Unsecured turnover caps not applied — this is a secured facility, so collateral and cash flow govern.`
          : `${marginPercent!.toFixed(1)}% margin × ${GST_POLICY.foirOnMargin * 100}% FOIR, capped at ${money(cap)} for this turnover band (unsecured programme).`,
    },
    knockouts,
  }
}

/* ------------------------------------------------------------------ bureau */

function bureau(lead: Lead, documents: DocumentRow[]): SectionView {
  const src = docOf(documents, 'CREDIT_REPORT')
  // The CIBIL score can also come straight off the lead record (user-entered),
  // so this section can be partially ready without a bureau report.
  const score = src ? num(src.data.score) ?? lead.cibil_score : lead.cibil_score
  const labels = ['Score', 'Live DPD', 'Obligations', 'Vintage']
  if (score === null && !src) return missing('BUREAU', 'Bureau', 'CREDIT_REPORT', 'Credit report', labels)

  const d = src?.data ?? {}
  const dpdText = str(d.live_dpd)
  const currentDpd = num(d.current_dpd)
  const obligations = num(d.total_monthly_obligations) ?? (lead.existing_emis || null)
  const oldestMonths = num(d.oldest_account_months)
  const vintage = num(d.credit_vintage_years) ?? (oldestMonths !== null ? oldestMonths / 12 : null)
  const util = num(d.revolving_utilisation_percent)
  const rank = str(d.commercial_rank)

  const activeAccounts = num(d.active_accounts)
  const totalSanctioned = num(d.total_sanctioned)
  const totalOutstanding = num(d.total_outstanding)
  const securedExp = num(d.secured_exposure)
  const unsecuredExp = num(d.unsecured_exposure)
  const activeUnsecured = num(d.active_unsecured_loans)
  const dpd30 = num(d.dpd_30_count)
  const dpd60 = num(d.dpd_60_count)
  const dpd90 = num(d.dpd_90_plus_count)
  const writeOffs = num(d.write_off_count)
  const settlements = num(d.settlement_count)
  const suits = num(d.suit_filed_count)
  const overdue = num(d.overdue_amount)
  const enq6 = num(d.enquiries_6m)
  const enq12 = num(d.enquiries_12m)

  const band: Band | null = score === null ? null
    : score >= 780 ? 'STRONG' : score >= 730 ? 'GOOD' : score >= 690 ? 'MODERATE' : score >= 650 ? 'WEAK' : 'CRITICAL'

  const policyBand = score === null ? null : BUREAU_POLICY.bands.find((b) => score >= b.min && score <= b.max) ?? null
  const floor = isSecured(lead) ? BUREAU_POLICY.minScoreSecured : BUREAU_POLICY.minScoreUnsecured

  const repaymentBand: Band | null =
    dpd90 === null && dpd60 === null && dpd30 === null && writeOffs === null ? null
    : (dpd90 ?? 0) > 0 || (writeOffs ?? 0) > 0 ? 'CRITICAL'
    : (dpd60 ?? 0) > 0 ? 'WEAK'
    : (dpd30 ?? 0) > 1 ? 'MODERATE'
    : (dpd30 ?? 0) === 1 ? 'GOOD' : 'STRONG'

  const enquiryBand: Band | null = enq6 === null ? null
    : enq6 >= BUREAU_POLICY.enquiryCritical6M ? 'CRITICAL'
    : enq6 >= BUREAU_POLICY.enquiryWarn6M ? 'WEAK'
    : enq6 >= 2 ? 'MODERATE' : 'STRONG'

  const utilBand: Band | null = util === null ? null
    : util >= BUREAU_POLICY.utilisationCriticalPercent ? 'CRITICAL'
    : util >= BUREAU_POLICY.utilisationWarnPercent ? 'WEAK'
    : util >= 40 ? 'MODERATE' : 'STRONG'

  const exposureTotal = securedExp !== null || unsecuredExp !== null ? (securedExp ?? 0) + (unsecuredExp ?? 0) : null
  const securedMix = exposureTotal && exposureTotal > 0 ? ((securedExp ?? 0) / exposureTotal) * 100 : null

  const adverse: string[] = []
  if (suits !== null && suits > 0) adverse.push(`${suits} suit-filed record(s)`)
  if (writeOffs !== null && writeOffs > 0) adverse.push(`${writeOffs} write-off(s)`)
  if (settlements !== null && settlements > 0) adverse.push(`${settlements} settlement(s)`)
  if (overdue !== null && overdue > 0) adverse.push(`${money(overdue)} currently overdue`)
  if (dpd90 !== null && dpd90 > 0) adverse.push(`${dpd90} account(s) hit 90+ DPD`)

  const knockouts: SectionKnockout[] = []
  if (score !== null && score < floor) {
    knockouts.push({
      code: 'BUREAU_MIN_SCORE', label: 'Bureau score below floor',
      detail: `${score} against a ${floor} floor for ${isSecured(lead) ? 'secured' : 'unsecured'} lending.`,
    })
  }
  if (currentDpd !== null && currentDpd >= BUREAU_POLICY.maxCurrentDpd) {
    knockouts.push({
      code: 'BUREAU_LIVE_DPD', label: 'Live delinquency',
      detail: `${currentDpd} days past due on a live facility.`,
    })
  }
  if ((writeOffs ?? 0) > 0 || (settlements ?? 0) > 0) {
    knockouts.push({
      code: 'BUREAU_ADVERSE', label: 'Write-off or settlement on record',
      detail: `${writeOffs ?? 0} write-off(s), ${settlements ?? 0} settlement(s) within ${BUREAU_POLICY.adverseLookbackMonths} months.`,
    })
  }
  if (!isSecured(lead) && activeUnsecured !== null && activeUnsecured > BUREAU_POLICY.maxActiveUnsecured) {
    knockouts.push({
      code: 'BUREAU_MAX_UNSECURED', label: 'Too many live unsecured loans',
      detail: `${activeUnsecured} active against a limit of ${BUREAU_POLICY.maxActiveUnsecured}.`,
    })
  }

  const liveDpdValue = currentDpd !== null ? (currentDpd === 0 ? 'None' : `${currentDpd} DPD`) : dpdText

  return {
    key: 'BUREAU', label: 'Bureau', sourceType: 'CREDIT_REPORT', sourceLabel: 'Credit report',
    status: 'ready', band,
    headline: knockouts.length
      ? 'Fails bureau gate'
      : [
          score !== null ? `${score}${policyBand ? ` ${policyBand.label}` : ''}` : null,
          repaymentBand === null ? null : repaymentBand === 'STRONG' ? 'clean track' : 'track record blemishes',
          obligations ? `${money(obligations)} monthly obligation` : null,
        ].filter(Boolean).join(' · ') || 'On file',
    metrics: [
      { label: 'Score', value: score !== null ? String(score) : null },
      { label: 'Live DPD', value: liveDpdValue },
      { label: 'Obligations', value: obligations ? `${fmtK(obligations)}/m` : null },
      { label: vintage !== null ? 'Vintage' : 'Utilisation', value: vintage !== null ? `${vintage.toFixed(1)}y` : util !== null ? pct(util) : null },
    ],
    signals: {
      title: 'Signals',
      sub: 'Score, repayment track and behaviour',
      rows: [
        {
          label: 'Bureau score',
          value: score !== null ? `${score}${policyBand ? ` · ${policyBand.label}` : ''}` : null,
          band,
          note: policyBand ? `Band ${policyBand.min}–${policyBand.max}; floor for this product ${floor}` : `Floor for this product ${floor}`,
        },
        ...(rank ? [{
          label: 'Commercial rank', value: rank,
          band: (() => {
            const n = Number(rank.replace(/[^0-9]/g, ''))
            return Number.isFinite(n) && n > 0 ? (n <= 3 ? 'STRONG' : n <= 6 ? 'MODERATE' : 'WEAK') as Band : null
          })(),
        }] : []),
        {
          label: 'Repayment track',
          value: repaymentBand === null ? null
            : (dpd30 ?? 0) + (dpd60 ?? 0) + (dpd90 ?? 0) === 0 ? 'Clean — no DPD'
            : `${dpd30 ?? 0}×30d · ${dpd60 ?? 0}×60d · ${dpd90 ?? 0}×90d+`,
          band: repaymentBand,
        },
        {
          label: 'Live delinquency', value: liveDpdValue,
          band: currentDpd === null ? null : currentDpd === 0 ? 'STRONG' : 'CRITICAL',
        },
        {
          label: 'Credit vintage', value: vintage !== null ? `${vintage.toFixed(1)} years` : null,
          band: vintage === null ? null : vintage >= 5 ? 'STRONG' : vintage >= 3 ? 'GOOD' : vintage >= 2 ? 'MODERATE' : 'WEAK',
        },
        {
          label: 'Enquiry velocity',
          value: enq6 === null && enq12 === null ? null
            : `${enq6 !== null ? `${enq6} in 6m` : '— in 6m'}${enq12 !== null ? ` · ${enq12} in 12m` : ''}`,
          band: enquiryBand,
          note: enquiryBand === 'WEAK' || enquiryBand === 'CRITICAL'
            ? 'Elevated enquiries suggest active credit-shopping' : undefined,
        },
        { label: 'Revolving utilisation', value: util !== null ? `${util.toFixed(0)}%` : null, band: utilBand },
        {
          label: 'Live obligations',
          value: obligations ? `${money(obligations)}/month${activeAccounts !== null ? ` across ${activeAccounts} accounts` : ''}` : null,
          band: obligations ? 'MODERATE' : null,
          note: totalOutstanding !== null || totalSanctioned !== null
            ? `Outstanding ${money(totalOutstanding) ?? '—'} of ${money(totalSanctioned) ?? '—'} sanctioned` : undefined,
        },
        {
          label: 'Secured mix', value: securedMix !== null ? `${securedMix.toFixed(0)}% secured` : null,
          band: securedMix === null ? null : securedMix >= 60 ? 'STRONG' : securedMix >= 30 ? 'GOOD' : 'MODERATE',
          note: activeUnsecured !== null ? `${activeUnsecured} live unsecured loan(s)` : undefined,
        },
      ],
    },
    // Always emitted so the policy card holds its place; with no adverse
    // records it renders the "clears policy" line rather than disappearing.
    chips: { title: 'Adverse records', band: adverse.length ? 'CRITICAL' : 'STRONG', items: adverse },
    bandPanels: [{
      title: 'Behaviour',
      items: [
        { label: 'Repayment track', band: repaymentBand },
        { label: 'Enquiry velocity', band: enquiryBand },
        { label: 'Utilisation', band: utilBand },
      ],
      metrics: [
        { label: 'Vintage', value: vintage !== null ? `${vintage.toFixed(1)}y` : null },
        { label: 'Secured', value: securedMix !== null ? `${securedMix.toFixed(0)}%` : null },
      ],
    }],
    knockouts,
  }
}

/* -------------------------------------------------------------- financials */

interface FinYear {
  label: string
  revenue: number | null
  grossProfit: number | null
  ebitda: number | null
  depreciation: number | null
  interest: number | null
  pat: number | null
  netWorth: number | null
  totalDebt: number | null
  currentAssets: number | null
  currentLiabilities: number | null
  inventory: number | null
  receivables: number | null
  payables: number | null
  cashBalance: number | null
}

function finYear(o: Record<string, unknown>, fallbackLabel: string): FinYear {
  return {
    label: str(o.financial_year) ?? fallbackLabel,
    revenue: num(o.revenue),
    grossProfit: num(o.gross_profit),
    ebitda: num(o.ebitda),
    depreciation: num(o.depreciation),
    interest: num(o.interest),
    pat: num(o.pat),
    netWorth: num(o.net_worth),
    totalDebt: num(o.total_debt),
    currentAssets: num(o.current_assets),
    currentLiabilities: num(o.current_liabilities),
    inventory: num(o.inventory),
    receivables: num(o.receivables),
    payables: num(o.payables),
    cashBalance: num(o.cash_balance),
  }
}

function financials(lead: Lead, documents: DocumentRow[]): SectionView {
  const src = docOf(documents, 'FINANCIAL_STATEMENT') ?? docOf(documents, 'ITR')
  const labels = ['Revenue', 'EBITDA', 'PAT', 'Net worth']
  if (!src) return missing('FINANCIALS', 'Financials', 'FINANCIAL_STATEMENT', 'Financial statement or ITR', labels)

  const d = src.data
  const yearRows = arr(d.years)
  const years: FinYear[] = yearRows.length
    ? yearRows.map((y, i) => finYear(y, `Year ${i + 1}`))
    : [finYear(d, str(d.financial_year) ?? str(d.assessment_year) ?? 'Latest')]
  const latest = years[years.length - 1]

  const revenue = latest.revenue ?? num(d.revenue)
  const ebitda = latest.ebitda ?? num(d.ebitda)
  const pat = latest.pat ?? num(d.pat)
  const netWorth = latest.netWorth ?? num(d.net_worth)
  // ITR fallback — gross_total_income stands in for revenue on a salaried/ITR file.
  const grossIncome = num(d.gross_total_income)
  const year = str(d.financial_year) ?? str(d.assessment_year) ?? latest.label

  const margin = revenue && ebitda ? (ebitda / revenue) * 100 : null
  const band: Band | null = margin === null ? (grossIncome !== null ? 'GOOD' : null)
    : margin >= 18 ? 'STRONG' : margin >= 10 ? 'GOOD' : margin >= 5 ? 'MODERATE' : 'WEAK'

  const cols = ['Head', ...years.map((y) => y.label)]
  const row = (head: string, pick: (y: FinYear) => number | null) =>
    [head, ...years.map((y) => money(pick(y)))]

  const pnl: SectionTable = {
    title: 'Profit & loss',
    sub: years.length > 1 ? `${years.length}-year summary` : 'Latest year on file',
    columns: cols,
    rows: [
      row('Gross revenue', (y) => y.revenue),
      row('Gross profit', (y) => y.grossProfit),
      row('EBITDA', (y) => y.ebitda),
      row('Depreciation', (y) => y.depreciation),
      row('Interest', (y) => y.interest),
      row('Profit after tax', (y) => y.pat),
    ],
    emphasise: [5],
  }
  const bs: SectionTable = {
    title: 'Balance sheet',
    sub: 'Position at year end',
    columns: cols,
    rows: [
      row('Net worth', (y) => y.netWorth),
      row('Total debt', (y) => y.totalDebt),
      row('Inventory', (y) => y.inventory),
      row('Receivables', (y) => y.receivables),
      row('Payables', (y) => y.payables),
      row('Cash & bank', (y) => y.cashBalance),
    ],
    emphasise: [0],
  }

  // Every ratio is computed off real statement lines; a missing line leaves the
  // tile blank rather than being back-filled with a plausible number.
  const ratio = (a: number | null, b: number | null) => a !== null && b !== null && b !== 0 ? a / b : null
  const days = (a: number | null, rev: number | null) => a !== null && rev !== null && rev !== 0 ? (a / rev) * 365 : null

  const currentRatio = ratio(latest.currentAssets, latest.currentLiabilities)
  const quickRatio = latest.currentAssets !== null && latest.inventory !== null
    ? ratio(latest.currentAssets - latest.inventory, latest.currentLiabilities) : null
  const debtEquity = ratio(latest.totalDebt, latest.netWorth)
  const interestCover = ratio(latest.ebitda, latest.interest)
  const dscr = ratio(latest.ebitda, num(d.debt_service))
  const grossMargin = latest.grossProfit !== null && latest.revenue ? (latest.grossProfit / latest.revenue) * 100 : null
  const debtorDays = days(latest.receivables, latest.revenue)
  const inventoryDays = days(latest.inventory, latest.revenue)
  const creditorDays = days(latest.payables, latest.revenue)

  const ratios: SectionRatioGrid = {
    title: 'Ratio analysis',
    sub: 'Against the programme benchmarks',
    items: [
      { label: 'Current Ratio', value: currentRatio?.toFixed(2) ?? null, benchmark: '> 1.50', ok: currentRatio === null ? null : currentRatio > 1.5 },
      { label: 'Quick Ratio', value: quickRatio?.toFixed(2) ?? null, benchmark: '> 1.00', ok: quickRatio === null ? null : quickRatio > 1 },
      { label: 'Debt to Equity', value: debtEquity?.toFixed(2) ?? null, benchmark: '< 1.00', ok: debtEquity === null ? null : debtEquity < 1 },
      { label: 'Interest Coverage', value: interestCover !== null ? `${interestCover.toFixed(2)}×` : null, benchmark: '> 2.00×', ok: interestCover === null ? null : interestCover > 2 },
      { label: 'DSCR', value: dscr?.toFixed(2) ?? null, benchmark: '> 1.25', ok: dscr === null ? null : dscr > 1.25 },
      { label: 'Gross Margin', value: grossMargin !== null ? `${grossMargin.toFixed(1)}%` : null, benchmark: 'Trade norm', ok: grossMargin === null ? null : grossMargin > 15 },
      { label: 'Debtor Days', value: debtorDays !== null ? `${debtorDays.toFixed(0)}d` : null, benchmark: '< 60d', ok: debtorDays === null ? null : debtorDays < 60 },
      { label: 'Inventory Days', value: inventoryDays !== null ? `${inventoryDays.toFixed(0)}d` : null, benchmark: '< 45d', ok: inventoryDays === null ? null : inventoryDays < 45 },
      { label: 'Creditor Days', value: creditorDays !== null ? `${creditorDays.toFixed(0)}d` : null, benchmark: '> 30d', ok: creditorDays === null ? null : creditorDays > 30 },
    ],
  }

  const revenuePoints = years.map((y) => ({ label: y.label, value: y.revenue, display: money(y.revenue) }))
  const hasRevenueSeries = revenuePoints.some((p) => p.value !== null)

  return {
    key: 'FINANCIALS', label: 'Financials', sourceType: 'FINANCIAL_STATEMENT', sourceLabel: 'Financial statement or ITR',
    status: 'ready', band,
    headline: [year ? `FY ${year}` : null, pat !== null ? `PAT ${money(pat)}` : grossIncome !== null ? `Gross income ${money(grossIncome)}` : null]
      .filter(Boolean).join(' · ') || 'Parsed',
    metrics: [
      { label: 'Revenue', value: revenue !== null ? fmtCr(revenue) : grossIncome !== null ? fmtL(grossIncome) : null },
      { label: 'EBITDA', value: ebitda !== null ? fmtL(ebitda) : null },
      { label: 'PAT', value: pat !== null ? fmtL(pat) : null },
      { label: 'Net worth', value: netWorth !== null ? fmtL(netWorth) : null },
    ],
    hero: [
      { label: 'Gross revenue', value: money(revenue ?? grossIncome) },
      { label: 'EBITDA', value: money(ebitda), sub: margin !== null ? `${margin.toFixed(1)}% margin` : null },
      { label: 'Profit after tax', value: money(pat) },
      { label: 'Net worth', value: money(netWorth) },
      { label: 'Total debt', value: money(latest.totalDebt), sub: debtEquity !== null ? `${debtEquity.toFixed(2)}× equity` : null },
    ],
    tables: [pnl, bs],
    ratios,
    trend: {
      title: 'Revenue trend',
      sub: hasRevenueSeries
        ? (years.length > 1 ? `${years.length}-year gross revenue` : 'Gross revenue on file')
        : 'No multi-year revenue in the parsed statement',
      points: revenuePoints,
      axis: years.map((y) => y.label),
    },
  }
}

/* -------------------------------------------------------------- business */

const CAUTION_INDUSTRIES = ['contractor', 'builder', 'chit', 'broker', 'gold', 'diamond', 'ngo', 'real estate']
const POSITIVE_INDUSTRIES = ['it', 'software', 'pharma', 'fmcg', 'food', 'plastic', 'textile', 'manufactur', 'tech', 'engineering']

const CONSTITUTION_LABEL: Record<string, string> = {
  PROPRIETORSHIP: 'Proprietorship', PARTNERSHIP: 'Partnership',
  PRIVATE_LIMITED: 'Private limited', LLP: 'LLP', PUBLIC_LIMITED: 'Public limited',
}

function business(lead: Lead, documents: DocumentRow[]): SectionView {
  const has = lead.business_name || lead.business_vintage_years !== null || lead.industry
  const labels = ['Vintage', 'Constitution', 'Industry', 'Entity']
  if (!has) {
    return {
      key: 'BUSINESS', label: 'Business', sourceType: null, sourceLabel: 'Business profile',
      status: 'missing', band: null,
      headline: 'Business profile not filled in yet',
      metrics: labels.map((l) => ({ label: l, value: null })),
    }
  }

  const vintage = lead.business_vintage_years
  const band: Band | null = vintage === null ? null
    : vintage >= 10 ? 'STRONG' : vintage >= 5 ? 'GOOD' : vintage >= 3 ? 'MODERATE' : 'WEAK'

  const constitution = lead.business_constitution
  const constitutionLabel = constitution ? CONSTITUTION_LABEL[constitution] ?? constitution : null
  const strength = constitution ? BUSINESS_POLICY.constitutionStrength[constitution] ?? null : null

  // Industry profile is a policy classification of a real, user-entered industry.
  const industry = lead.industry
  const lower = (industry ?? '').toLowerCase()
  const industryProfile: 'POSITIVE' | 'NEUTRAL' | 'CAUTION' | null = !industry ? null
    : CAUTION_INDUSTRIES.some((k) => lower.includes(k)) ? 'CAUTION'
    : POSITIVE_INDUSTRIES.some((k) => lower.includes(k)) ? 'POSITIVE' : 'NEUTRAL'

  // Working-capital cycle is derived from the financial statement, not guessed.
  const fin = docOf(documents, 'FINANCIAL_STATEMENT')
  const finYears = fin ? arr(fin.data.years) : []
  const finLatest = fin ? finYear(finYears.length ? finYears[finYears.length - 1] : fin.data, 'Latest') : null
  const rev = finLatest?.revenue ?? null
  const dayCount = (v: number | null) => v !== null && rev !== null && rev !== 0 ? Math.round((v / rev) * 365) : null
  const debtorDays = dayCount(finLatest?.receivables ?? null)
  const inventoryDays = dayCount(finLatest?.inventory ?? null)
  const creditorDays = dayCount(finLatest?.payables ?? null)
  const cycleDays = debtorDays !== null && inventoryDays !== null && creditorDays !== null
    ? debtorDays + inventoryDays - creditorDays : null
  const cycleBand: Band | null = cycleDays === null ? null
    : cycleDays <= BUSINESS_POLICY.cycleGoodDays ? 'STRONG'
    : cycleDays <= BUSINESS_POLICY.cycleModerateDays ? 'GOOD'
    : cycleDays <= BUSINESS_POLICY.cycleWeakDays ? 'MODERATE' : 'WEAK'

  // Profile detail captured on the lead (migration 010) — null until filled in.
  const premisesOwnership = str(leadField(lead, 'business_premises_ownership'))
  const yearsAtPremises = num(leadField(lead, 'business_years_at_premises'))
  const employeeCount = num(leadField(lead, 'business_employee_count'))
  const udyam = bool(leadField(lead, 'business_udyam_registered'))
  const creditSales = num(leadField(lead, 'business_credit_sales_percent'))
  const gstDoc = docOf(documents, 'GST_RETURNS')
  const concentration = (gstDoc ? num(gstDoc.data.top_counterparty_percent) : null)
    ?? num(leadField(lead, 'business_customer_concentration_percent'))

  const concentrationBand: Band | null = concentration === null ? null
    : concentration >= BUSINESS_POLICY.concentrationCriticalPercent ? 'CRITICAL'
    : concentration >= BUSINESS_POLICY.concentrationWarnPercent ? 'WEAK'
    : concentration >= 25 ? 'MODERATE' : 'STRONG'

  const stabilityBand: Band | null = yearsAtPremises === null ? null
    : premisesOwnership === 'OWNED' && yearsAtPremises >= 5 ? 'STRONG'
    : yearsAtPremises >= 3 ? 'GOOD' : yearsAtPremises >= 1 ? 'MODERATE' : 'WEAK'

  // Structure recommendation is a rule over real inputs; withheld without them.
  let structure: string | null = null
  let rationale: string | null = null
  if (cycleDays !== null) {
    if (cycleDays > BUSINESS_POLICY.cycleModerateDays) {
      structure = 'DROPLINE OD'
      rationale = `A ${cycleDays}-day operating cycle means receipts are lumpy. A dropline OD lets the borrower draw at the peak of the cycle and repay on collection, instead of a fixed EMI that lands in lean months.`
    } else if (creditSales !== null && creditSales >= 70 && debtorDays !== null && debtorDays >= 45) {
      structure = 'INVOICE FINANCE'
      rationale = `${creditSales.toFixed(0)}% credit sales at ${debtorDays} debtor days means capital is tied up in receivables. Invoice-backed finance funds the gap directly and self-liquidates on collection.`
    } else if (cycleDays > BUSINESS_POLICY.cycleGoodDays) {
      structure = 'CASH CREDIT'
      rationale = `A ${cycleDays}-day cycle with stable turnover suits a cash credit limit sized on drawing power, reviewed annually.`
    } else {
      structure = 'TERM LOAN'
      rationale = `Short ${cycleDays}-day cycle${creditSales !== null ? ` and ${(100 - creditSales).toFixed(0)}% cash sales` : ''} mean receipts are steady and predictable — an EMI-based term loan is the cheaper structure.`
    }
  }

  const knockouts: SectionKnockout[] = []
  if (vintage !== null && vintage < BUSINESS_POLICY.minVintageYears) {
    knockouts.push({
      code: 'BIZ_MIN_VINTAGE', label: 'Business vintage below minimum',
      detail: `${vintage.toFixed(1)} years against a ${BUSINESS_POLICY.minVintageYears}-year floor.`,
    })
  }
  if (industryProfile === 'CAUTION') {
    knockouts.push({
      code: 'BIZ_CAUTION_INDUSTRY', label: 'Caution-list industry',
      detail: `${industry} is on the caution list — requires additional approval and restricts the lender panel.`,
    })
  }

  return {
    key: 'BUSINESS', label: 'Business', sourceType: null, sourceLabel: 'Business profile',
    status: 'ready', band,
    headline: [
      vintage !== null ? `${vintage.toFixed(0)}-year ${constitutionLabel?.toLowerCase() ?? 'business'}` : lead.business_name,
      cycleDays !== null ? `${cycleDays}-day cycle` : null,
      structure ? `${structure.toLowerCase()} indicated` : null,
    ].filter(Boolean).join(' · ') || lead.business_name || 'Business profile on file',
    metrics: [
      { label: 'Vintage', value: vintage !== null ? `${vintage}y` : null },
      { label: 'Constitution', value: constitutionLabel },
      { label: 'Industry', value: industry },
      { label: 'Entity', value: lead.business_name },
    ],
    hero: [
      { label: 'Entity', value: lead.business_name },
      { label: 'Constitution', value: constitutionLabel },
      { label: 'Vintage', value: vintage !== null ? `${vintage.toFixed(1)}y` : null, band },
      { label: 'Operating cycle', value: cycleDays !== null ? `${cycleDays}d` : null, band: cycleBand },
      { label: 'Scale', value: employeeCount !== null ? `${employeeCount}` : null, sub: 'Employees' },
    ],
    signals: {
      title: 'Signals',
      sub: 'Constitution, industry, vintage and cycle',
      rows: [
        {
          label: 'Constitution', value: constitutionLabel,
          band: strength === null ? null : strength >= 75 ? 'STRONG' : strength >= 60 ? 'GOOD' : 'MODERATE',
        },
        {
          label: 'Industry',
          value: industry ? `${industry}${industryProfile ? ` · ${industryProfile}` : ''}` : null,
          band: industryProfile === null ? null
            : industryProfile === 'POSITIVE' ? 'STRONG' : industryProfile === 'NEUTRAL' ? 'GOOD' : 'CRITICAL',
          note: industryProfile === 'CAUTION' ? 'Restricted across several lenders — check panel before login' : undefined,
        },
        {
          label: 'Vintage', value: vintage !== null ? `${vintage.toFixed(1)} years` : null, band,
          note: udyam === null ? undefined : udyam ? 'Udyam registered' : 'Not Udyam registered',
        },
        {
          label: 'Operating cycle', value: cycleDays !== null ? `${cycleDays} days` : null, band: cycleBand,
          note: debtorDays !== null && inventoryDays !== null && creditorDays !== null
            ? `Debtors ${debtorDays}d + inventory ${inventoryDays}d − creditors ${creditorDays}d` : undefined,
        },
        {
          label: 'Sales mix',
          value: creditSales !== null ? `${creditSales.toFixed(0)}% credit · ${(100 - creditSales).toFixed(0)}% cash` : null,
          band: creditSales === null ? null : creditSales <= 40 ? 'STRONG' : creditSales <= 70 ? 'GOOD' : 'MODERATE',
        },
        {
          label: 'Customer concentration',
          value: concentration !== null ? `${concentration.toFixed(0)}% top client` : null,
          band: concentrationBand,
        },
        {
          label: 'Premises',
          value: premisesOwnership || yearsAtPremises !== null
            ? [premisesOwnership?.toLowerCase(), yearsAtPremises !== null ? `${yearsAtPremises} years` : null].filter(Boolean).join(' · ')
            : null,
          band: stabilityBand,
        },
        {
          label: 'Scale', value: employeeCount !== null ? `${employeeCount} employees` : null,
          band: employeeCount === null ? null
            : employeeCount >= 50 ? 'STRONG' : employeeCount >= 15 ? 'GOOD' : employeeCount >= 5 ? 'MODERATE' : 'WEAK',
        },
      ],
    },
    prose: [{
      title: 'Recommended structure',
      sub: 'Matching the facility to the cash-flow shape',
      badge: structure ?? null,
      text: structure && rationale
        ? rationale
        : 'Not determined yet — needs the working-capital cycle and turnover to recommend a facility shape.',
    }],
    meter: {
      title: 'Working capital cycle',
      headline: { label: 'Net operating cycle', value: cycleDays !== null ? `${cycleDays}d` : null },
      fillPercent: cycleDays !== null ? Math.max(0, Math.min(100, (cycleDays / 150) * 100)) : null,
      band: cycleBand,
      axis: ['0d', '60d', '120d+'],
      note: cycleDays !== null
        ? 'Longer cycles tie up working capital and argue for a revolving facility over a fixed EMI.'
        : 'Needs receivable, payable and inventory days to compute the operating cycle.',
    },
    knockouts,
  }
}

/* ------------------------------------------------------------------- stock */

function stock(lead: Lead, documents: DocumentRow[]): SectionView {
  const src = docOf(documents, 'STOCK_STATEMENT')
  const labels = ['Gross stock', 'Book debts', 'Creditors', 'Drawing power']
  if (!src) return missing('STOCK', 'Stock', 'STOCK_STATEMENT', 'Stock statement', labels)

  const d = src.data
  const rawMaterial = num(d.raw_material)
  const wip = num(d.wip)
  const finishedGoods = num(d.finished_goods)
  const componentSum = [rawMaterial, wip, finishedGoods].some((v) => v !== null)
    ? [rawMaterial, wip, finishedGoods].reduce<number>((s, v) => s + (v ?? 0), 0) : null
  const grossStock = num(d.gross_stock) ?? componentSum
  const marginPercent = num(d.margin_percent)
  const netEligible = num(d.net_eligible_stock)
    ?? (grossStock !== null ? grossStock * (1 - (marginPercent ?? STOCK_DEFAULT_MARGIN_PERCENT) / 100) : null)
  const bookDebts = num(d.book_debts)
  const creditors = num(d.creditors)
  const drawingPower = num(d.drawing_power)
    ?? (netEligible !== null && bookDebts !== null && creditors !== null
      ? Math.max(0, netEligible + bookDebts - creditors) : null)
  const sanctionedLimit = num(d.sanctioned_limit)
  const util = num(d.limit_utilisation_percent)
  const auditDate = str(d.audit_date) ?? str(d.statement_month)

  const band: Band | null = util === null ? null
    : util <= 70 ? 'STRONG' : util <= 85 ? 'GOOD' : util <= 95 ? 'MODERATE' : 'WEAK'

  const share = (v: number | null) => v !== null && grossStock ? (v / grossStock) * 100 : null
  const inventoryRows: SectionBreakdownRow[] = [
    { label: 'Raw materials', sub: 'Held at plant', value: money(rawMaterial), sharePercent: share(rawMaterial) },
    { label: 'Work in progress', sub: 'In assembly pipeline', value: money(wip), sharePercent: share(wip) },
    { label: 'Finished goods', sub: 'Ready for despatch', value: money(finishedGoods), sharePercent: share(finishedGoods) },
  ]

  const effectiveMargin = marginPercent ?? (netEligible !== null && grossStock ? (1 - netEligible / grossStock) * 100 : null)

  return {
    key: 'STOCK', label: 'Stock', sourceType: 'STOCK_STATEMENT', sourceLabel: 'Stock statement',
    status: 'ready', band,
    headline: drawingPower !== null ? `Drawing power ${money(drawingPower)}` : 'Statement parsed',
    metrics: [
      { label: 'Gross stock', value: grossStock !== null ? fmtL(grossStock) : null },
      { label: 'Book debts', value: bookDebts !== null ? fmtL(bookDebts) : null },
      { label: 'Creditors', value: creditors !== null ? fmtL(creditors) : null },
      { label: 'Utilisation', value: util !== null ? pct(util) : null },
    ],
    hero: [
      { label: 'Gross stock', value: money(grossStock) },
      { label: 'Book debts', value: money(bookDebts) },
      { label: 'Sundry creditors', value: money(creditors) },
      { label: 'Drawing power', value: money(drawingPower) },
      { label: 'Sanctioned limit', value: money(sanctionedLimit), sub: 'Working capital' },
    ],
    breakdowns: [{
      title: 'Inventory breakdown',
      sub: auditDate ? `Last audited ${auditDate}` : 'As declared on the statement',
      rows: inventoryRows,
      total: { label: 'Gross stock valuation', value: money(grossStock) },
    }],
    panels: [{
      title: 'Drawing power',
      sub: 'Net eligible stock plus book debts, less creditors',
      items: [
        {
          label: effectiveMargin !== null
            ? `Net eligible stock (after ${effectiveMargin.toFixed(0)}% margin)`
            : 'Net eligible stock',
          value: money(netEligible),
        },
        { label: 'Add: book debts', value: money(bookDebts) },
        { label: 'Less: sundry creditors', value: creditors !== null ? `(${money(creditors)})` : null },
        { label: 'Drawing power available', value: money(drawingPower), emphasis: true },
      ],
    }],
    meter: {
      title: 'Limit utilisation',
      headline: { label: 'Sanctioned limit', value: money(sanctionedLimit) },
      fillPercent: util,
      band: util === null ? null : util > 90 ? 'WEAK' : util > 70 ? 'MODERATE' : 'STRONG',
      note: util !== null
        ? `${util.toFixed(0)}% of sanctioned limit drawn`
        : 'Needs a sanctioned limit and drawing power from the stock statement.',
    },
    conduct: {
      title: 'Facility headroom',
      band: drawingPower !== null && sanctionedLimit !== null
        ? (drawingPower < sanctionedLimit ? 'MODERATE' : 'STRONG')
        : 'MODERATE',
      text: drawingPower !== null && sanctionedLimit !== null
        ? (drawingPower < sanctionedLimit
            ? 'Drawing power is below the sanctioned limit — the facility is constrained by stock and receivables, not by the sanction.'
            : 'Drawing power exceeds the sanctioned limit — there is scope to seek an enhancement.')
        : 'Headroom cannot be read until both the sanctioned limit and drawing power are on file.',
    },
  }
}

/* -------------------------------------------------------------- collateral */

function collateral(lead: Lead, documents: DocumentRow[]): SectionView {
  const val = docOf(documents, 'PROPERTY_VALUATION')
  const d = val?.data ?? {}
  const value = num(d.valuation_amount) ?? lead.property_value
  const labels = ['Value', 'Net LTV', 'Requested', 'Location']

  const needsCollateral = isSecured(lead)
  if (!needsCollateral) {
    return {
      key: 'COLLATERAL', label: 'Collateral', sourceType: null, sourceLabel: 'Valuation report',
      status: 'ready', band: null,
      headline: 'Unsecured facility — no security offered',
      metrics: labels.map((l) => ({ label: l, value: null })),
      prose: [{
        title: 'Unsecured facility',
        text: 'No security offered. Capacity rests entirely on cash flow and bureau standing.',
      }],
    }
  }
  if (value === null) return missing('COLLATERAL', 'Collateral', 'PROPERTY_VALUATION', 'Valuation report', labels)

  const propertyType = str(d.property_type)?.toUpperCase().replace(/\s+/g, '_') ?? null
  const realisable = num(d.realisable_value)
  const encumbrance = num(d.existing_encumbrance)
  const sqft = num(d.built_up_area_sqft)
  const ageYears = num(d.property_age_years)
  const tier = str(d.location_tier)
  const occupancy = str(d.occupancy)
  const ownership = str(d.ownership)
  const legalStatus = str(d.legal_status)
  const technicalStatus = str(d.technical_status)
  const titleClear = bool(d.title_clear)
  const approved = bool(d.approved_by_authority)
  const chainYears = num(d.chain_of_title_years)
  const rental = num(d.monthly_rental_income)

  const requested = Number(lead.requested_amount)
  const ltvCapRate = propertyType ? COLLATERAL_POLICY.ltvCaps[propertyType] ?? null : null
  const ltvCapPercent = ltvCapRate !== null ? ltvCapRate * 100 : null
  const maxFundingAtCap = ltvCapRate !== null ? value * ltvCapRate : null
  const netCollateralAvailable = maxFundingAtCap !== null
    ? Math.max(0, maxFundingAtCap - (encumbrance ?? 0)) : null

  const grossLtv = value > 0 ? (requested / value) * 100 : null
  const netLtv = value > 0 ? ((requested + (encumbrance ?? 0)) / value) * 100 : null
  const realisableLtv = realisable && realisable > 0 ? (requested / realisable) * 100 : null
  const cover = realisable !== null && requested > 0 ? realisable / requested : null

  const ltv = netLtv ?? grossLtv
  const band: Band | null = ltv === null ? null
    : ltv <= 60 ? 'STRONG' : ltv <= 75 ? 'GOOD' : ltv <= 85 ? 'MODERATE' : ltv <= 95 ? 'WEAK' : 'CRITICAL'

  const marketability: Band | null = propertyType === null && tier === null ? null
    : propertyType === 'RESIDENTIAL' && tier === 'TIER_1' ? 'STRONG'
    : propertyType === 'PLOT' || tier === 'TIER_3' ? 'WEAK'
    : propertyType === 'INDUSTRIAL' ? 'MODERATE' : 'GOOD'

  const legalTechnical: Band | null = legalStatus === null && technicalStatus === null ? null
    : legalStatus === 'ADVERSE' || technicalStatus === 'ADVERSE' ? 'CRITICAL'
    : legalStatus === 'CLEARED' && technicalStatus === 'CLEARED' ? 'STRONG'
    : legalStatus === 'IN_PROGRESS' || technicalStatus === 'IN_PROGRESS' ? 'MODERATE' : 'WEAK'

  const ageBand: Band | null = ageYears === null ? null
    : ageYears <= 10 ? 'STRONG' : ageYears <= 20 ? 'GOOD'
    : ageYears <= COLLATERAL_POLICY.maxPropertyAgeYears ? 'MODERATE' : 'WEAK'

  const knockouts: SectionKnockout[] = []
  if (titleClear === false) {
    knockouts.push({ code: 'COL_TITLE', label: 'Title not clear', detail: 'Marketable title is a precondition to any secured sanction.' })
  }
  if (legalStatus === 'ADVERSE' || technicalStatus === 'ADVERSE') {
    knockouts.push({
      code: 'COL_DILIGENCE_ADVERSE', label: 'Adverse legal or technical report',
      detail: `Legal ${(legalStatus ?? 'not reported').toLowerCase()}, technical ${(technicalStatus ?? 'not reported').toLowerCase()}.`,
    })
  }
  if (approved === false) {
    knockouts.push({
      code: 'COL_UNAPPROVED', label: 'Unapproved construction',
      detail: 'Property lacks competent-authority approval; most lenders decline or heavily discount.',
    })
  }

  const overCap = netLtv !== null && ltvCapPercent !== null && netLtv > ltvCapPercent

  return {
    key: 'COLLATERAL', label: 'Collateral', sourceType: 'PROPERTY_VALUATION', sourceLabel: 'Valuation report',
    status: 'ready', band,
    headline: [
      money(value),
      propertyType ? propertyType.toLowerCase() : null,
      netLtv !== null ? `${netLtv.toFixed(0)}% net LTV${ltvCapPercent !== null ? ` against ${ltvCapPercent}% cap` : ''}` : null,
      cover !== null ? `${cover.toFixed(2)}× cover` : null,
    ].filter(Boolean).join(' · ') || 'Valued',
    metrics: [
      { label: 'Value', value: fmtCr(value) },
      { label: 'Net LTV', value: ltv !== null ? pct(ltv) : null },
      { label: 'Requested', value: fmtL(requested) },
      { label: 'Location', value: lead.property_city },
    ],
    meter: {
      title: 'LTV position',
      sub: 'Proposed exposure against policy cap',
      fillPercent: grossLtv,
      overlayPercent: netLtv !== null && grossLtv !== null ? Math.max(0, netLtv - grossLtv) : null,
      capPercent: ltvCapPercent,
      fillLabel: grossLtv !== null ? pct1(grossLtv) : null,
      capLabel: ltvCapPercent !== null ? `cap ${ltvCapPercent}%` : null,
      band,
      legend: [
        { label: 'Proposed', kind: 'fill' },
        { label: 'Existing charge', kind: 'overlay' },
        { label: 'Policy cap', kind: 'cap' },
      ],
      alert: overCap
        ? {
            band: 'CRITICAL',
            text: `Net LTV exceeds the ${ltvCapPercent}% cap. This resizes the loan rather than declining it — fundable amount is capped at ${money(netCollateralAvailable)}.`,
          }
        : undefined,
      tiles: [
        { label: 'Gross LTV', value: grossLtv !== null ? pct1(grossLtv) : null },
        { label: 'Net LTV', value: netLtv !== null ? pct1(netLtv) : null, band: overCap ? 'CRITICAL' : netLtv !== null && ltvCapPercent !== null ? 'STRONG' : null },
        { label: 'On realisable', value: realisableLtv !== null ? pct1(realisableLtv) : null },
        { label: 'Cover', value: cover !== null ? `${cover.toFixed(2)}×` : null, band: cover === null ? null : cover >= COLLATERAL_POLICY.minSecurityCoverage ? 'STRONG' : 'WEAK' },
      ],
    },
    signals: {
      title: 'Signals',
      rows: [
        {
          label: 'Property',
          value: [
            propertyType?.toLowerCase() ?? null,
            sqft !== null ? `${sqft.toLocaleString('en-IN')} sqft` : null,
            tier ? tier.replace('_', '-') : null,
          ].filter(Boolean).join(' · ') || null,
          band: marketability,
        },
        {
          label: 'Market value', value: money(value), band: 'GOOD',
          note: realisable !== null
            ? `Realisable ${money(realisable)}${value > 0 ? ` (${((realisable / value) * 100).toFixed(0)}% of market)` : ''}`
            : undefined,
        },
        {
          label: 'LTV cap',
          value: ltvCapPercent !== null ? `${ltvCapPercent}%${maxFundingAtCap !== null ? ` → ${money(maxFundingAtCap)}` : ''}` : null,
          band: ltvCapPercent !== null ? 'GOOD' : null,
          note: propertyType ? `Policy cap for ${propertyType.toLowerCase()} security` : undefined,
        },
        {
          label: 'Proposed LTV',
          value: grossLtv !== null ? `${grossLtv.toFixed(1)}% gross${netLtv !== null ? ` · ${netLtv.toFixed(1)}% net of charges` : ''}` : null,
          band: netLtv === null || ltvCapPercent === null ? null
            : netLtv <= ltvCapPercent * 0.8 ? 'STRONG' : netLtv <= ltvCapPercent ? 'GOOD' : 'CRITICAL',
        },
        {
          label: 'Existing charge',
          value: encumbrance === null ? null : encumbrance > 0 ? money(encumbrance) : 'Nil — unencumbered',
          band: encumbrance === null ? null : encumbrance === 0 ? 'STRONG' : 'MODERATE',
        },
        {
          label: 'Security coverage', value: cover !== null ? `${cover.toFixed(2)}×` : null,
          band: cover === null ? null : cover >= 2 ? 'STRONG' : cover >= COLLATERAL_POLICY.minSecurityCoverage ? 'GOOD' : 'WEAK',
          note: `Realisable value ÷ loan; floor ${COLLATERAL_POLICY.minSecurityCoverage}×`,
        },
        {
          label: 'Legal & technical',
          value: legalStatus || technicalStatus
            ? `Legal ${(legalStatus ?? '—').replace(/_/g, ' ').toLowerCase()} · technical ${(technicalStatus ?? '—').replace(/_/g, ' ').toLowerCase()}`
            : null,
          band: legalTechnical,
        },
        {
          label: 'Title & age',
          value: titleClear === null && chainYears === null && ageYears === null ? null
            : [
                titleClear === null ? null : titleClear ? 'Clear title' : 'Title unclear',
                chainYears !== null ? `${chainYears}yr chain` : null,
                ageYears !== null ? `${ageYears}yr old` : null,
              ].filter(Boolean).join(' · '),
          band: titleClear === false ? 'CRITICAL' : ageBand,
        },
        ...(rental !== null && rental > 0 ? [{
          label: 'Rental income', value: `${money(rental)}/month`, band: 'GOOD' as Band,
          note: 'Supports servicing; verify lease tenure',
        }] : []),
      ],
    },
    panels: [{
      title: 'Security',
      items: [
        { label: 'Ownership', value: titleCase(ownership) },
        { label: 'Occupancy', value: titleCase(occupancy) },
        { label: 'Location', value: lead.property_city },
        { label: 'Stage', value: lead.property_stage === 'READY_TO_MOVE' ? 'Ready to move' : lead.property_stage === 'UNDER_CONSTRUCTION' ? 'Under construction' : null },
        { label: 'Valuer', value: str(d.valuer_name) },
        { label: 'Valued on', value: str(d.valuation_date) },
      ],
    }],
    capacity: {
      label: 'Implied capacity',
      value: money(netCollateralAvailable),
      basis: netCollateralAvailable !== null
        ? `${ltvCapPercent}% of ${money(value)} less ${money(encumbrance ?? 0)} existing charge`
        : 'Needs a valued property and an LTV cap on the product to compute headroom.',
    },
    knockouts,
  }
}

/** Signals that support / concern the file, each tagged with its source section. */
export interface Signal {
  text: string
  detail?: string
  source: string
  band: Band
}

export function buildSignals(sections: SectionView[], lead: Lead): { strengths: Signal[]; concerns: Signal[] } {
  const strengths: Signal[] = []
  const concerns: Signal[] = []

  for (const s of sections) {
    if (s.status !== 'ready' || !s.band) continue
    const lead_ = s.metrics.find((m) => m.value !== null)
    const detail = lead_ ? `${lead_.label}: ${lead_.value}` : undefined
    if (s.band === 'STRONG' || s.band === 'GOOD') {
      strengths.push({ text: `${s.label} — ${s.headline}`, detail, source: s.label, band: s.band })
    } else if (s.band === 'WEAK' || s.band === 'CRITICAL') {
      concerns.push({ text: `${s.label} — ${s.headline}`, detail, source: s.label, band: s.band })
    }
  }

  // Policy knockouts read off real parsed values outrank everything else.
  for (const s of sections) {
    for (const k of s.knockouts ?? []) {
      concerns.push({ text: `${s.label} — ${k.label}`, detail: k.detail, source: s.label, band: 'CRITICAL' })
    }
  }

  // Missing-information concerns, so the user always knows what to chase next.
  for (const s of sections) {
    if (s.status === 'missing') {
      concerns.push({
        text: `${s.label} not assessable yet`,
        detail: s.sourceType
          ? `Upload the ${s.sourceLabel.toLowerCase()} to score this section`
          : 'Complete the business profile on the Applicant tab to score this section',
        source: s.label,
        band: 'MODERATE' as Band,
      })
    }
  }

  if (!lead.monthly_income) {
    concerns.push({ text: 'Monthly income not on file', detail: 'Enter it on the Applicant tab or apply it from a salary slip', source: 'Applicant', band: 'WEAK' })
  }

  return { strengths, concerns }
}

export { bandFromScore }
