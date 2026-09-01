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
  | 'BANKING' | 'ITR' | 'GST' | 'BUREAU' | 'FINANCIALS' | 'BUSINESS' | 'STOCK' | 'COLLATERAL'

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
    itr(lead, documents),
    gst(lead, documents),
    bureau(lead, documents),
    financials(lead, documents),
    business(lead, documents),
    stock(lead, documents),
    collateral(lead, documents),
  ]
}

/**
 * Flattens whatever a built section actually populated into plain-text
 * facts — the exact same figures already on screen, nothing re-derived from
 * raw extracted_json. Feeds the AI-summary prompt for any section uniformly,
 * so "do not invent numbers" holds by construction: the model only ever
 * sees numbers this app already computed and displayed.
 */
export function sectionFacts(section: SectionView): string {
  const lines: string[] = [`${section.label}: ${section.headline}`]
  for (const m of section.metrics) if (m.value) lines.push(`${m.label}: ${m.value}`)
  for (const h of [...(section.hero ?? []), ...(section.subHero ?? [])]) {
    if (h.value) lines.push(`${h.label}: ${h.value}${h.sub ? ` (${h.sub})` : ''}`)
  }
  for (const row of section.signals?.rows ?? []) {
    if (row.value) lines.push(`${row.label}: ${row.value}${row.note ? ` — ${row.note}` : ''}`)
  }
  for (const p of section.panels ?? []) {
    for (const item of p.items) if (item.value) lines.push(`${p.title} — ${item.label}: ${item.value}`)
  }
  if (section.chips?.items?.length) lines.push(`${section.chips.title}: ${section.chips.items.join('; ')}`)
  if (section.notes?.items?.length) lines.push(...section.notes.items.map((n) => `Note: ${n}`))
  if (section.conduct) lines.push(`${section.conduct.title} (${section.conduct.band}): ${section.conduct.text}`)
  if (section.capacity?.value) lines.push(`${section.capacity.label}: ${section.capacity.value}`)
  if (section.knockouts?.length) lines.push(`Policy knockouts: ${section.knockouts.map((k) => k.label).join('; ')}`)
  return lines.join('\n')
}

/** Stand-in for an absent document so a section can still build its skeleton. */
const EMPTY_SOURCE = { doc: null as unknown as DocumentRow, data: {} as Record<string, unknown> }

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
  const found = docOf(documents, 'BANK_STATEMENT')
  // Build the full section either way. With no statement every value resolves
  // to null, the tab keeps its shape, and `status` drives the upload prompt.
  const src = found ?? EMPTY_SOURCE
  const hasSource = found !== null

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: [bankName, str(src.data.account_type)].filter(Boolean).join(' · ') || (hasSource ? 'Statement parsed' : 'Bank statement not on file yet'),
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

/* --------------------------------------------------------------------- ITR */

/** One assessment year off the return set — a "3 years" upload carries two or three. */
interface ItrYear {
  /** Column caption — "AY 2025-26" where the return states it. */
  label: string
  assessmentYear: string | null
  financialYear: string | null
  form: string | null
  nature: string | null
  presumptive: boolean | null
  presumptiveSection: string | null
  grossTotalIncome: number | null
  taxableIncome: number | null
  deductions: number | null
  salary: number | null
  businessIncome: number | null
  rental: number | null
  interestIncome: number | null
  otherIncome: number | null
  turnover: number | null
  grossProfit: number | null
  netProfit: number | null
  depreciation: number | null
  interestExpense: number | null
  remuneration: number | null
  businessExpenses: number | null
  lossesCarriedForward: number | null
  taxPayable: number | null
  taxPaid: number | null
  advanceTax: number | null
  tdsCredit: number | null
  demand: number | null
  filingDate: string | null
  filedOnTime: boolean | null
  returnStatus: string | null
  revised: boolean | null
  revisionCount: number | null
  netWorth: number | null
  businessAssets: number | null
  unsecuredLoans: number | null
  capitalIntroduced: number | null
  tradeCreditors: number | null
  negativeCapital: boolean | null
}

const ITR_NATURE_LABEL: Record<string, string> = {
  SALARIED: 'Salaried', PROPRIETOR: 'Proprietor', PARTNER: 'Partner in a firm',
  DIRECTOR: 'Director / shareholder', PROFESSIONAL: 'Professional',
  COMMISSION_FREELANCE: 'Commission / freelance', RENT_INVESTMENT: 'Rent & investment',
  AGRICULTURE: 'Agricultural',
}

/** How dependable each head of income is on its own, before the file's other evidence. */
const ITR_NATURE_BAND: Record<string, Band> = {
  SALARIED: 'STRONG', PROPRIETOR: 'GOOD', PARTNER: 'GOOD', DIRECTOR: 'GOOD',
  PROFESSIONAL: 'GOOD', COMMISSION_FREELANCE: 'MODERATE',
  RENT_INVESTMENT: 'MODERATE', AGRICULTURE: 'MODERATE',
}

function itrYear(o: Record<string, unknown>, fallbackLabel: string): ItrYear {
  const ay = str(o.assessment_year)
  const fy = str(o.financial_year)
  return {
    label: ay ? `AY ${ay}` : fy ? `FY ${fy}` : fallbackLabel,
    assessmentYear: ay,
    financialYear: fy,
    form: str(o.itr_form),
    nature: str(o.nature_of_income)?.toUpperCase().replace(/\s+/g, '_') ?? null,
    presumptive: bool(o.is_presumptive),
    presumptiveSection: str(o.presumptive_section),
    grossTotalIncome: num(o.gross_total_income),
    taxableIncome: num(o.taxable_income),
    deductions: num(o.total_deductions),
    salary: num(o.salary_income),
    businessIncome: num(o.business_income),
    rental: num(o.rental_income),
    interestIncome: num(o.interest_income),
    otherIncome: num(o.other_income),
    turnover: num(o.business_turnover),
    grossProfit: num(o.gross_profit),
    netProfit: num(o.net_profit),
    depreciation: num(o.depreciation),
    interestExpense: num(o.interest_expense),
    remuneration: num(o.partner_remuneration),
    businessExpenses: num(o.business_expenses),
    lossesCarriedForward: num(o.losses_carried_forward),
    taxPayable: num(o.tax_payable),
    taxPaid: num(o.tax_paid),
    advanceTax: num(o.advance_tax_paid),
    tdsCredit: num(o.tds_credit),
    demand: num(o.tax_demand_outstanding),
    filingDate: str(o.filing_date),
    filedOnTime: bool(o.filed_on_time),
    returnStatus: str(o.return_status)?.toUpperCase().replace(/\s+/g, '_') ?? null,
    revised: bool(o.is_revised_return),
    revisionCount: num(o.revision_count),
    netWorth: num(o.net_worth),
    businessAssets: num(o.business_assets),
    unsecuredLoans: num(o.unsecured_loans),
    capitalIntroduced: num(o.capital_introduced),
    tradeCreditors: num(o.trade_creditors),
    negativeCapital: bool(o.negative_capital),
  }
}

/** Points per band, so several component reads can be averaged into one. */
const BAND_POINTS: Record<Band, number> = {
  STRONG: 90, GOOD: 75, MODERATE: 60, WEAK: 45, CRITICAL: 25,
}
/** The worse of the bands supplied — a cross-check is only as good as its weakest leg. */
function worstBand(bands: (Band | null)[]): Band | null {
  const present = bands.filter((b): b is Band => b !== null)
  if (!present.length) return null
  return present.reduce((a, b) => (BAND_POINTS[b] < BAND_POINTS[a] ? b : a))
}

function itr(lead: Lead, documents: DocumentRow[]): SectionView {
  const found = docOf(documents, 'ITR')
  const src = found ?? EMPTY_SOURCE
  const hasSource = found !== null
  const d = src.data

  // The upload is a set of returns. Where the parse gave only headline figures
  // we still build a single year off them, so the tab keeps its shape.
  const yearRows = arr(d.years)
  const years: ItrYear[] = yearRows.length
    ? yearRows.map((y, i) => itrYear(y, `Year ${i + 1}`))
    : [itrYear(d, 'Latest')]
  const latest = years[years.length - 1]
  const oldest = years[0]

  const marginOf = (y: ItrYear) => y.netProfit !== null && y.turnover ? (y.netProfit / y.turnover) * 100 : null
  const cashProfitOf = (y: ItrYear) =>
    y.netProfit === null ? null : y.netProfit + (y.depreciation ?? 0) + (y.remuneration ?? 0)

  // ---- Income level and trend ---------------------------------------------
  const incomeSeries = years.map((y) => y.grossTotalIncome)
  const presentIncome = incomeSeries.filter((v): v is number => v !== null)
  const avgIncome = mean(presentIncome)
  const sd = stddev(presentIncome)
  const cov = sd !== null && avgIncome ? (sd / avgIncome) * 100 : null

  // Year-on-year steps between consecutive returns, oldest first.
  const steps = years.slice(1).map((y, i) => {
    const prev = years[i].grossTotalIncome
    return prev !== null && prev > 0 && y.grossTotalIncome !== null
      ? ((y.grossTotalIncome - prev) / prev) * 100 : null
  })
  const latestStep = steps.length ? steps[steps.length - 1] : null
  const earlierAvgStep = mean(steps.slice(0, -1).filter((s): s is number => s !== null))
  const spanYears = years.length - 1
  const cagr = oldest.grossTotalIncome !== null && oldest.grossTotalIncome > 0
    && latest.grossTotalIncome !== null && spanYears > 0
    ? (Math.pow(latest.grossTotalIncome / oldest.grossTotalIncome, 1 / spanYears) - 1) * 100 : null

  // The pattern that matters is not growth — it is growth that arrives only in
  // the year before the application and that the earlier years do not support.
  const suddenJump = latestStep !== null && latestStep >= 50
    && (earlierAvgStep === null || earlierAvgStep <= 20)

  const stabilityBand: Band | null = presentIncome.length < 2 ? null
    : suddenJump ? 'WEAK'
    : latestStep !== null && latestStep < -20 ? 'WEAK'
    : cov !== null && cov <= 15 ? 'STRONG'
    : cov !== null && cov <= 30 ? 'GOOD'
    : 'MODERATE'

  const stabilityText = presentIncome.length < 2 ? 'One year on file — trend not assessable'
    : suddenJump ? 'Sudden step-up in the latest year'
    : latestStep !== null && latestStep < -20 ? 'Declining'
    : stabilityBand === 'STRONG' ? 'Consistent'
    : stabilityBand === 'GOOD' ? 'Broadly steady' : 'Uneven'

  // ---- Nature of income ----------------------------------------------------
  const nature = latest.nature
  const natureLabel = nature ? ITR_NATURE_LABEL[nature] ?? titleCase(nature) : null
  const natureBand = nature ? ITR_NATURE_BAND[nature] ?? null : null
  const presumptive = latest.presumptive
  const presumptiveSection = latest.presumptiveSection

  // ---- Profit computation --------------------------------------------------
  const latestMargin = marginOf(latest)
  const priorMargin = years.length > 1 ? marginOf(years[years.length - 2]) : null
  const marginBand: Band | null = latestMargin === null ? null
    : latestMargin >= 15 ? 'STRONG' : latestMargin >= 8 ? 'GOOD'
    : latestMargin >= 4 ? 'MODERATE' : latestMargin > 0 ? 'WEAK' : 'CRITICAL'
  const cashProfit = cashProfitOf(latest)
  const lossYears = years.filter((y) => y.netProfit !== null && y.netProfit < 0).length

  // ---- Tax compliance ------------------------------------------------------
  const lateYears = years.filter((y) => y.filedOnTime === false).length
  const timingKnown = years.some((y) => y.filedOnTime !== null)
  const revisedYears = years.filter((y) => y.revised === true || (y.revisionCount ?? 0) > 0).length
  const defective = years.some((y) => y.returnStatus === 'DEFECTIVE')
  const demandValues = years.map((y) => y.demand).filter((v): v is number => v !== null)
  const demandTotal = demandValues.length ? demandValues.reduce((s, v) => s + v, 0) : null
  const taxShortfall = latest.taxPayable !== null && latest.taxPaid !== null
    ? latest.taxPayable - latest.taxPaid : null
  const effectiveTaxRate = latest.taxPaid !== null && latest.grossTotalIncome
    ? (latest.taxPaid / latest.grossTotalIncome) * 100 : null
  const statusKnown = years.some((y) => y.returnStatus !== null)

  const complianceBand: Band | null = !timingKnown && demandTotal === null && !statusKnown ? null
    : defective || (demandTotal ?? 0) > 0 ? 'WEAK'
    : lateYears >= 2 || revisedYears >= 2 ? 'WEAK'
    : lateYears === 1 || revisedYears === 1 ? 'MODERATE'
    : taxShortfall !== null && taxShortfall > 0 ? 'MODERATE'
    : 'STRONG'

  // ---- Turnover credibility: ITR against GST and against banking ----------
  const gstFound = docOf(documents, 'GST_RETURNS')
  const gstMonthly = gstFound ? arr(gstFound.data.monthly_turnover).map((m) => num(m.taxable_value)).filter((v): v is number => v !== null) : []
  const gstTurnover = gstFound
    ? num(gstFound.data.turnover) ?? (gstMonthly.length ? gstMonthly.reduce((s, v) => s + v, 0) : null)
    : null
  const gstDelta = latest.turnover !== null && gstTurnover !== null && gstTurnover > 0
    ? ((latest.turnover - gstTurnover) / gstTurnover) * 100 : null
  const gstGap = gstDelta === null ? null : Math.abs(gstDelta)
  const gstBand: Band | null = gstGap === null ? null
    : gstGap <= 10 ? 'STRONG' : gstGap <= 20 ? 'GOOD' : gstGap <= 35 ? 'MODERATE'
    : gstGap <= 50 ? 'WEAK' : 'CRITICAL'

  const bankFound = docOf(documents, 'BANK_STATEMENT')
  const bankMonthly = bankFound ? numList(bankFound.data.monthly_credits) : []
  const bankTotal = bankMonthly.length ? bankMonthly.reduce((s, v) => s + v, 0) : null
  // Statements rarely run exactly twelve months; annualise so the comparison
  // against a full year's return is like for like, and say so in the note.
  const annualisedCredits = bankTotal !== null && bankMonthly.length
    ? (bankTotal / bankMonthly.length) * 12 : null
  // Cash-heavy credits undercut the turnover comparison itself — the money
  // arrived, but the return cannot say who it came from.
  const cashDepositPercent = bankFound ? num(bankFound.data.cash_deposit_percent) : null
  const declaredForBank = latest.turnover ?? latest.grossTotalIncome
  const bankRatio = declaredForBank !== null && annualisedCredits
    ? declaredForBank / annualisedCredits : null
  const bankBand: Band | null = bankRatio === null ? null
    : bankRatio >= 0.75 && bankRatio <= 1.25 ? 'STRONG'
    : bankRatio >= 0.6 && bankRatio <= 1.4 ? 'GOOD'
    : bankRatio >= 0.5 && bankRatio <= 1.6 ? 'MODERATE'
    : 'WEAK'
  const credibilityBand = worstBand([gstBand, bankBand])
  const bankMismatchNote = bankRatio === null ? ''
    : bankRatio < 0.5 ? ' — banking runs well ahead of the declared income'
    : bankRatio > 1.6 ? ' — the declared figure is not landing in this account' : ''

  // ---- Assets and liabilities ---------------------------------------------
  const netWorth = latest.netWorth
  const negativeCapital = latest.negativeCapital === true || (netWorth !== null && netWorth < 0)
  const netWorthBand: Band | null = netWorth === null ? (latest.negativeCapital === true ? 'CRITICAL' : null)
    : netWorth < 0 ? 'CRITICAL'
    : latest.unsecuredLoans !== null && netWorth > 0 && latest.unsecuredLoans > netWorth ? 'WEAK'
    : netWorth >= 0 ? 'GOOD' : null

  // ---- Red flags: only the ones the parsed figures actually evidence -------
  const flags: string[] = []
  if (suddenJump && latestStep !== null) flags.push(`Income up ${latestStep.toFixed(0)}% in the latest year alone`)
  if (latestStep !== null && latestStep < -20) flags.push(`Income down ${Math.abs(latestStep).toFixed(0)}% year on year`)
  if (latestMargin !== null && priorMargin !== null && priorMargin - latestMargin >= 5) {
    flags.push(`Margin down ${(priorMargin - latestMargin).toFixed(1)} pts`)
  }
  if (lossYears >= 2) flags.push(`Losses in ${lossYears} of ${years.length} years`)
  if ((latest.lossesCarriedForward ?? 0) > 0) flags.push(`${money(latest.lossesCarriedForward)} losses carried forward`)
  if (gstGap !== null && gstGap > 25) flags.push(`ITR turnover ${gstDelta! > 0 ? 'above' : 'below'} GST by ${gstGap.toFixed(0)}%`)
  if (bankRatio !== null && bankRatio < 0.5) flags.push('Bank credits far exceed declared income')
  if (cashDepositPercent !== null && cashDepositPercent > 25) {
    flags.push(`Cash is ${cashDepositPercent.toFixed(0)}% of bank credits`)
  }
  if (bankRatio !== null && bankRatio > 1.6) flags.push('Declared turnover not seen in the banking')
  if ((demandTotal ?? 0) > 0) flags.push(`${money(demandTotal)} tax demand outstanding`)
  if (lateYears > 0) flags.push(`${lateYears} return${lateYears === 1 ? '' : 's'} filed after the due date`)
  if (revisedYears >= 2) flags.push(`Returns revised in ${revisedYears} years`)
  if (defective) flags.push('A return is marked defective')
  if (negativeCapital) flags.push('Negative net worth / eroded capital')
  if (latest.unsecuredLoans !== null && netWorth !== null && netWorth > 0 && latest.unsecuredLoans > netWorth) {
    flags.push('Unsecured loans exceed net worth')
  }
  if (latest.otherIncome !== null && latest.grossTotalIncome && latest.otherIncome / latest.grossTotalIncome > 0.4) {
    flags.push('Over 40% of income from other / one-off heads')
  }
  if (nature === 'COMMISSION_FREELANCE') flags.push('Income mainly commission / freelance')
  if (latest.deductions !== null && latest.grossTotalIncome && latest.deductions / latest.grossTotalIncome > 0.25) {
    flags.push('Deductions cut over 25% of gross income')
  }
  if (lead.existing_emis > 0 && latest.grossTotalIncome !== null && latest.grossTotalIncome > 0
    && lead.existing_emis > (latest.grossTotalIncome / 12) * 0.5) {
    flags.push('Existing EMIs above half of declared monthly income')
  }

  // ---- Section band: stability + compliance + credibility, less the flags --
  const componentBands = [stabilityBand, complianceBand, credibilityBand, marginBand]
    .filter((b): b is Band => b !== null)
  const base = componentBands.length ? mean(componentBands.map((b) => BAND_POINTS[b])) : null
  const band: Band | null = base === null ? null
    : bandFromScore(Math.max(0, base - flags.length * 6))

  // ---- Tables --------------------------------------------------------------
  const cols = ['Head', ...years.map((y) => y.label)]
  const moneyRow = (head: string, pick: (y: ItrYear) => number | null) =>
    [head, ...years.map((y) => money(pick(y)))]
  const textRow = (head: string, pick: (y: ItrYear) => string | null) =>
    [head, ...years.map(pick)]

  const incomeTable: SectionTable = {
    title: 'Income computation',
    sub: years.length > 1 ? `${years.length} assessment years, oldest first` : 'Latest return on file',
    columns: cols,
    rows: [
      moneyRow('Salary income', (y) => y.salary),
      moneyRow('Business / profession', (y) => y.businessIncome),
      moneyRow('House property (rent)', (y) => y.rental),
      moneyRow('Interest income', (y) => y.interestIncome),
      moneyRow('Other income', (y) => y.otherIncome),
      moneyRow('Gross total income', (y) => y.grossTotalIncome),
      moneyRow('Less: Chapter VI-A deductions', (y) => y.deductions),
      moneyRow('Taxable income', (y) => y.taxableIncome),
    ],
    emphasise: [5, 7],
  }

  const profitTable: SectionTable = {
    title: 'Profit computation',
    sub: 'Self-employed heads — blank on a salaried return, and thin where income is declared presumptively',
    columns: cols,
    rows: [
      moneyRow('Gross receipts / turnover', (y) => y.turnover),
      moneyRow('Gross profit', (y) => y.grossProfit),
      moneyRow('Business expenses', (y) => y.businessExpenses),
      moneyRow('Depreciation', (y) => y.depreciation),
      moneyRow('Interest expense', (y) => y.interestExpense),
      moneyRow('Partner remuneration', (y) => y.remuneration),
      moneyRow('Net profit', (y) => y.netProfit),
      textRow('Net margin', (y) => { const m = marginOf(y); return m === null ? null : pct1(m) }),
      moneyRow('Cash profit (add back depreciation, remuneration)', cashProfitOf),
      moneyRow('Losses carried forward', (y) => y.lossesCarriedForward),
    ],
    emphasise: [6, 8],
  }

  // ---- Observations: rule-based reads of the figures above, never filler ---
  const observations: string[] = []
  if (suddenJump && latestStep !== null) {
    observations.push(`Gross income rises ${latestStep.toFixed(0)}% in ${latest.label}${earlierAvgStep !== null ? ` against ${earlierAvgStep.toFixed(0)}% average growth in the earlier years` : ''}. A step-up that lands immediately before the application needs the underlying business reason before the higher figure is used for sizing.`)
  } else if (stabilityBand === 'STRONG' && avgIncome !== null) {
    observations.push(`Gross income holds around ${money(avgIncome)} across ${years.length} years — a consistent figure is more credible for sizing than a single strong year.`)
  }
  if (presumptive === true) {
    observations.push(`Income is declared presumptively${presumptiveSection ? ` under section ${presumptiveSection}` : ''} — a percentage of gross receipts rather than a computed profit. Detailed expense and depreciation lines will not be on the return, further business expenses cannot be claimed against it, and actual cash flow may be stronger than the declared taxable income. Lenders differ on the multiplier they apply to it.`)
  }
  if (cashProfit !== null && latest.netProfit !== null && cashProfit > latest.netProfit) {
    observations.push(`Adding back ${money(latest.depreciation ?? 0)} depreciation and ${money(latest.remuneration ?? 0)} partner remuneration takes ${money(latest.netProfit)} net profit to ${money(cashProfit)} of cash profit. Whether that add-back is allowed is lender policy — it is shown, not applied.`)
  }
  if (gstGap !== null) {
    observations.push(gstGap > 25
      ? `ITR turnover of ${money(latest.turnover)} differs from GST turnover of ${money(gstTurnover)} by ${gstGap.toFixed(0)}%. A gap this wide usually means the income gets discounted or the file gets referred for deeper verification.`
      : `ITR turnover of ${money(latest.turnover)} reconciles with GST turnover of ${money(gstTurnover)} within ${gstGap.toFixed(0)}%.`)
  }
  if (bankRatio !== null) {
    observations.push(bankRatio < 0.5
      ? `Annualised bank credits of ${money(annualisedCredits)} are well above the ${money(declaredForBank)} declared. Low declared income against heavy banking is a standard verification trigger.`
      : bankRatio > 1.6
        ? `${money(declaredForBank)} declared against ${money(annualisedCredits)} of annualised bank credits. Either receipts run through accounts not on file, or the declared figure is not supported by the banking.`
        : `Declared income of ${money(declaredForBank)} sits in line with ${money(annualisedCredits)} of annualised bank credits.`)
  }
  if (cashDepositPercent !== null && cashDepositPercent > 25) {
    observations.push(`${cashDepositPercent.toFixed(0)}% of bank credits are cash deposits. Cash-heavy receipts weaken the turnover comparison above, since the return cannot evidence where that money came from.`)
  }
  if (negativeCapital) {
    observations.push('Capital is negative on the balance-sheet block of the return — accumulated losses or drawings have eroded the owner\'s stake, which most lenders treat as a decline or a heavy discount.')
  }

  return {
    key: 'ITR', label: 'ITR', sourceType: 'ITR', sourceLabel: 'ITR',
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: [
      latest.assessmentYear ? `AY ${latest.assessmentYear}` : null,
      latest.form,
      natureLabel,
      latest.grossTotalIncome !== null ? `${money(latest.grossTotalIncome)} gross income` : null,
      presentIncome.length >= 2 ? stabilityText.toLowerCase() : null,
    ].filter(Boolean).join(' · ') || (hasSource ? 'Return parsed' : 'ITR not on file yet'),
    metrics: [
      { label: 'Gross income', value: latest.grossTotalIncome !== null ? fmtL(latest.grossTotalIncome) : null },
      { label: 'Turnover', value: latest.turnover !== null ? fmtCr(latest.turnover) : null },
      { label: 'Margin', value: latestMargin !== null ? pct1(latestMargin) : null },
      { label: 'Years on file', value: hasSource ? String(years.length) : null },
    ],
    trend: {
      title: 'Income trend',
      sub: !hasSource ? 'Gross total income — fills in per assessment year from the uploaded return'
        : years.length > 1 ? `Gross total income across ${years.length} assessment years`
        : 'Gross total income — one return on file',
      right: latestStep === null ? null : {
        text: `${latestStep >= 0 ? '+' : ''}${latestStep.toFixed(1)}% YoY`,
        // Growth is not automatically good: a jump that only appears in the
        // year before the application reads as a caution, not a strength.
        band: suddenJump ? 'WEAK' : latestStep >= 0 ? 'STRONG' : 'CRITICAL',
      },
      points: years.map((y) => ({
        label: y.label, value: y.grossTotalIncome, display: money(y.grossTotalIncome),
      })),
      axis: sparseAxis(years.map((y) => y.label)),
      tiles: [
        { label: 'Latest', value: money(latest.grossTotalIncome), sub: hasSource ? latest.label : null },
        { label: 'Average', value: money(avgIncome), sub: hasSource ? `${years.length}-year mean` : null },
        {
          label: 'CAGR', value: cagr === null ? null : `${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}%`,
          sub: spanYears > 0 ? `Over ${spanYears} year${spanYears === 1 ? '' : 's'}` : null,
          band: cagr === null ? null : suddenJump ? 'MODERATE' : cagr >= 0 ? 'STRONG' : 'WEAK',
        },
        {
          label: 'Stability', value: cov === null ? null : `${cov.toFixed(0)}% CoV`,
          sub: hasSource ? stabilityText : null, band: stabilityBand,
        },
        { label: 'Turnover', value: money(latest.turnover), sub: latest.turnover !== null ? 'Latest year' : null },
      ],
    },
    hero: [
      { label: 'Gross total income', value: money(latest.grossTotalIncome), sub: latest.label },
      { label: 'Taxable income', value: money(latest.taxableIncome), sub: latest.deductions !== null ? `After ${money(latest.deductions)} deductions` : null },
      { label: 'Turnover', value: money(latest.turnover), sub: 'Gross receipts declared' },
      { label: 'Net profit', value: money(latest.netProfit), sub: latestMargin !== null ? `${pct1(latestMargin)} margin` : null, band: marginBand },
      { label: 'Tax paid', value: money(latest.taxPaid), sub: effectiveTaxRate !== null ? `${pct1(effectiveTaxRate)} of gross income` : null },
    ],
    tables: [incomeTable, profitTable],
    signals: {
      title: 'Signals',
      sub: 'Income, nature, profit, compliance and credibility',
      rows: [
        {
          label: 'Income trend & stability',
          value: presentIncome.length < 2 ? null
            : `${stabilityText}${cagr !== null ? ` · ${cagr >= 0 ? '+' : ''}${cagr.toFixed(1)}% CAGR` : ''}`,
          band: stabilityBand,
          note: !hasSource ? undefined
            : presentIncome.length < 2
              ? 'Only one assessment year parsed — two or three are needed to read a trend'
            : suddenJump
              ? 'Growth concentrated in the year before the application — verify the business reason before sizing on it'
              : cov !== null ? `Coefficient of variation ${cov.toFixed(0)}% across ${years.length} years` : undefined,
        },
        {
          label: 'Nature of income',
          value: [natureLabel, latest.form].filter(Boolean).join(' · ') || null,
          band: natureBand,
          note: presumptive === true
            ? `Presumptive income${presumptiveSection ? ` under ${presumptiveSection}` : ''} — declared as a percentage of receipts, so detailed expense data is not on the return and declared income may understate real cash flow`
            : presumptive === false ? 'Regular computation — detailed expense lines available' : undefined,
        },
        {
          label: 'Profit margin',
          value: latestMargin !== null ? `${pct1(latestMargin)} on ${money(latest.turnover)}` : null,
          band: marginBand,
          note: presumptive === true
            ? 'On a presumptive return this is the statutory rate, not a computed margin'
            : priorMargin !== null ? `Prior year ${pct1(priorMargin)}` : undefined,
        },
        {
          label: 'Cash profit after add-backs',
          value: money(cashProfit),
          band: cashProfit === null ? null : cashProfit > 0 ? 'GOOD' : 'WEAK',
          note: 'Net profit plus depreciation and partner remuneration. Shown for reference — whether it is allowed as eligible income is lender policy.',
        },
        {
          label: 'Filing discipline',
          value: !timingKnown && !statusKnown ? null
            : [
                timingKnown ? (lateYears === 0 ? 'All returns on time' : `${lateYears} filed late`) : null,
                latest.returnStatus ? titleCase(latest.returnStatus) : null,
              ].filter(Boolean).join(' · '),
          band: complianceBand,
          note: revisedYears > 0
            ? `Revised in ${revisedYears} of ${years.length} years${latest.filingDate ? ` · latest filed ${latest.filingDate}` : ''}`
            : latest.filingDate ? `Latest return filed ${latest.filingDate}` : undefined,
        },
        {
          label: 'Tax paid vs payable',
          value: latest.taxPayable === null && latest.taxPaid === null ? null
            : `${money(latest.taxPaid) ?? '—'} paid of ${money(latest.taxPayable) ?? '—'} payable`,
          band: taxShortfall === null ? null : taxShortfall <= 0 ? 'STRONG' : 'MODERATE',
          note: [
            latest.advanceTax !== null ? `Advance tax ${money(latest.advanceTax)}` : null,
            latest.tdsCredit !== null ? `TDS credit ${money(latest.tdsCredit)}` : null,
          ].filter(Boolean).join(' · ') || undefined,
        },
        {
          label: 'Outstanding demand',
          value: demandTotal === null ? null : demandTotal > 0 ? money(demandTotal) : 'Nil',
          band: demandTotal === null ? null : demandTotal > 0 ? 'WEAK' : 'STRONG',
          note: demandTotal !== null && demandTotal > 0
            ? 'An open demand has to be cleared or explained before most lenders will sanction' : undefined,
        },
        {
          label: 'ITR vs GST turnover',
          value: gstDelta === null ? null
            : `${money(latest.turnover)} vs ${money(gstTurnover)} · ${gstDelta >= 0 ? '+' : ''}${gstDelta.toFixed(0)}%`,
          band: gstBand,
          note: gstFound === null
            ? 'GST returns are not on file yet — nothing to verify the declared turnover against'
            : latest.turnover === null
              ? 'The ITR did not state a turnover, so no comparison is possible'
              : gstGap !== null && gstGap > 25
                ? 'A material mismatch — expect the income to be discounted or the file referred' : undefined,
        },
        {
          label: 'ITR vs bank credits',
          value: bankRatio === null ? null
            : `${money(declaredForBank)} declared vs ${money(annualisedCredits)} credited`,
          band: bankBand,
          note: bankFound === null
            ? 'No bank statement on file yet — the declared figures cannot be checked against actual credits'
            : declaredForBank === null
              ? 'The ITR yielded neither a turnover nor a gross income to compare'
              : `Credits annualised from ${bankMonthly.length} statement month${bankMonthly.length === 1 ? '' : 's'}${bankMismatchNote}`,
        },
        {
          label: 'Net worth',
          value: money(netWorth),
          band: netWorthBand,
          note: negativeCapital
            ? 'Negative capital on the return — accumulated losses or drawings have eroded the owner\'s stake'
            : latest.unsecuredLoans !== null ? `Unsecured / related-party loans ${money(latest.unsecuredLoans)}` : undefined,
        },
      ],
    },
    panels: [
      {
        title: 'Return & filing',
        sub: str(d.assessee_name) ?? undefined,
        items: [
          { label: 'Assessment year', value: latest.assessmentYear },
          { label: 'Financial year', value: latest.financialYear },
          { label: 'ITR form', value: latest.form },
          { label: 'PAN', value: str(d.pan_number) },
          { label: 'Nature of income', value: natureLabel },
          {
            label: 'Presumptive',
            value: presumptive === null ? null
              : presumptive ? `Yes${presumptiveSection ? ` · ${presumptiveSection}` : ''}` : 'No — regular computation',
          },
          { label: 'Return status', value: titleCase(latest.returnStatus) },
          { label: 'Filed on', value: latest.filingDate },
          {
            label: 'Revisions',
            value: latest.revisionCount !== null ? String(latest.revisionCount)
              : latest.revised === null ? null : latest.revised ? 'Revised' : 'Original',
          },
        ],
      },
      {
        title: 'Assets & liabilities',
        sub: 'From the balance-sheet block of the return, where it carries one',
        items: [
          { label: negativeCapital ? 'Net worth (negative)' : 'Net worth', value: money(netWorth), emphasis: netWorth !== null && netWorth > 0 },
          { label: 'Business assets', value: money(latest.businessAssets) },
          { label: 'Unsecured / related-party loans', value: money(latest.unsecuredLoans) },
          { label: 'Capital introduced', value: money(latest.capitalIntroduced) },
          { label: 'Trade creditors', value: money(latest.tradeCreditors) },
        ],
      },
    ],
    // Held in place whenever a return is on file: with nothing computable
    // triggering it renders the clear state rather than disappearing. Withheld
    // entirely with no return, since "no red flags" would be a claim about a
    // document nobody has read.
    chips: hasSource
      ? { title: 'Red flags', band: flags.length ? 'CRITICAL' : 'STRONG', items: flags }
      : undefined,
    notes: observations.length
      ? { title: 'What the return says', sub: 'Read across income, profit, compliance and the cross-checks', items: observations }
      : undefined,
    conduct: hasSource && band
      ? {
          title: 'Income credibility',
          band,
          text: [
            presentIncome.length >= 2
              ? (suddenJump
                  ? 'Income steps up sharply in the year before the application rather than building over the period on file.'
                  : `Income is ${stabilityText.toLowerCase()} across ${years.length} assessment years.`)
              : 'Only one assessment year is on file, so consistency cannot be read yet.',
            complianceBand === 'STRONG' ? 'Returns are filed on time with no open demand.'
              : complianceBand === null ? 'The return did not yield filing dates or status.'
              : 'Filing or tax-payment history needs explaining before sanction.',
            credibilityBand === null
              ? 'Neither GST returns nor a bank statement is on file to verify the declared figures against.'
              : credibilityBand === 'STRONG' || credibilityBand === 'GOOD'
                ? 'Declared figures reconcile with the other documents on file.'
                : 'Declared figures do not reconcile cleanly with the other documents on file.',
          ].join(' '),
        }
      : undefined,
  }
}

/* --------------------------------------------------------------------- GST */

function gst(lead: Lead, documents: DocumentRow[]): SectionView {
  const found = docOf(documents, 'GST_RETURNS')
  const src = found ?? EMPTY_SOURCE
  const hasSource = found !== null

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: knockouts.length
      ? 'Fails GST programme gate'
      : [
          turnover !== null ? `${money(turnover)} turnover` : null,
          yoy === null ? null : yoy >= 0 ? 'growing' : 'declining',
          missed === null ? null : missed === 0 ? 'filings current' : 'filing gaps present',
        ].filter(Boolean).join(', ') || (hasSource ? 'Returns parsed' : 'GST returns not on file yet'),
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
  const found = docOf(documents, 'CREDIT_REPORT')
  const src = found ?? EMPTY_SOURCE
  // The CIBIL score can also come straight off the lead record (user-entered),
  // so this section can be partially ready without a bureau report.
  const score = num(src.data.score) ?? lead.cibil_score
  const hasSource = found !== null || score !== null

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: knockouts.length
      ? 'Fails bureau gate'
      : [
          score !== null ? `${score}${policyBand ? ` ${policyBand.label}` : ''}` : null,
          repaymentBand === null ? null : repaymentBand === 'STRONG' ? 'clean track' : 'track record blemishes',
          obligations ? `${money(obligations)} monthly obligation` : null,
        ].filter(Boolean).join(' · ') || (hasSource ? 'On file' : 'Credit report not on file yet'),
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
  const found = docOf(documents, 'FINANCIAL_STATEMENT') ?? docOf(documents, 'ITR')
  const src = found ?? EMPTY_SOURCE
  const hasSource = found !== null

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: [year ? `FY ${year}` : null, pat !== null ? `PAT ${money(pat)}` : grossIncome !== null ? `Gross income ${money(grossIncome)}` : null]
      .filter(Boolean).join(' · ') || (hasSource ? 'Parsed' : 'Financial statement or ITR not on file yet'),
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
  const labels = ['Vintage', 'Constitution', 'Industry', 'Entity']
  // No early return: the tab keeps its full shape whether or not the profile
  // has been filled in, and `status` drives the prompt at the top.
  const hasSource = Boolean(lead.business_name || lead.business_vintage_years !== null || lead.industry)

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: [
      vintage !== null ? `${vintage.toFixed(0)}-year ${constitutionLabel?.toLowerCase() ?? 'business'}` : lead.business_name,
      cycleDays !== null ? `${cycleDays}-day cycle` : null,
      structure ? `${structure.toLowerCase()} indicated` : null,
    ].filter(Boolean).join(' · ') || lead.business_name || (hasSource ? 'Business profile on file' : 'Business profile not filled in yet'),
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
  const found = docOf(documents, 'STOCK_STATEMENT')
  const src = found ?? EMPTY_SOURCE
  const hasSource = found !== null

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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: drawingPower !== null ? `Drawing power ${money(drawingPower)}` : (hasSource ? 'Statement parsed' : 'Stock statement not on file yet'),
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
  const hasSource = value !== null

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
  const maxFundingAtCap = ltvCapRate !== null && value !== null ? value * ltvCapRate : null
  const netCollateralAvailable = maxFundingAtCap !== null
    ? Math.max(0, maxFundingAtCap - (encumbrance ?? 0)) : null

  const grossLtv = value !== null && value > 0 ? (requested / value) * 100 : null
  const netLtv = value !== null && value > 0 ? ((requested + (encumbrance ?? 0)) / value) * 100 : null
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
    status: hasSource ? 'ready' : 'missing', band: hasSource ? band : null,
    headline: [
      money(value),
      propertyType ? propertyType.toLowerCase() : null,
      netLtv !== null ? `${netLtv.toFixed(0)}% net LTV${ltvCapPercent !== null ? ` against ${ltvCapPercent}% cap` : ''}` : null,
      cover !== null ? `${cover.toFixed(2)}× cover` : null,
    ].filter(Boolean).join(' · ') || (hasSource ? 'Valued' : 'Valuation report not on file yet'),
    metrics: [
      { label: 'Value', value: value !== null ? fmtCr(value) : null },
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
            ? `Realisable ${money(realisable)}${value !== null && value > 0 ? ` (${((realisable / value) * 100).toFixed(0)}% of market)` : ''}`
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
      basis: netCollateralAvailable !== null && value !== null
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
