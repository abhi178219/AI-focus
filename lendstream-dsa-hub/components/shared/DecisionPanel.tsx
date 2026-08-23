import { Layers, Scale, AlertOctagon, Gauge } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { BandBar, BandPill } from '@/components/ui/BandPill'
import { BandRing } from '@/components/shared/BandRing'
import { StatTile, KeyValueRow } from '@/components/shared/StatTile'
import { RunAssessmentButton } from '@/components/shared/RunAssessmentButton'
import { fmtAmount } from '@/lib/format'
import { buildQualityFactors } from '@/lib/decision/qualityFactors'
import {
  BAND_SOLID,
  type Lead, type DocumentRow, type Assessment, type AssessmentPillar,
  type Product, type LenderProduct, type Band, type Verdict,
} from '@/lib/types'

const VERDICT_SOLID: Record<Verdict, string> = {
  PASS: 'bg-[#1a7f5a]', REFER: 'bg-[#a06a10]', DECLINE: 'bg-[#b3323f]',
}
const PILLAR_LABEL: Record<string, string> = {
  BANKING: 'Banking', BUREAU: 'Bureau', COLLATERAL: 'Collateral', GST: 'GST',
}

interface CapacityMethod {
  key: string
  label: string
  basis: string
  amount: number | null
  applicable: boolean
  note?: string
}

/** Sums a numeric array pulled out of a document's extracted_json. */
function sumNumbers(value: unknown): number | null {
  if (!Array.isArray(value)) return null
  const nums = value.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  return nums.length ? nums.reduce((s, n) => s + n, 0) : null
}

function numberField(doc: DocumentRow | undefined, key: string): number | null {
  const v = doc?.extracted_json?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Decision tab. Mirrors the prototype's Decision screen: composite ring +
 * verdict + recommendation, capacity by method, turnover triangulation,
 * knockouts, pillar bars, terms tested and conditions.
 *
 * Everything here reads from a stored assessment row, the lead record, the
 * product policy, or fields the extractor actually pulled out of an uploaded
 * document. Where a source is missing the row says so rather than guessing.
 */
export function DecisionPanel({
  leadId, lead, assessment, pillars, product, lenderProducts, documents,
}: {
  leadId: string
  lead: Lead
  assessment: (Assessment & { assessment_pillars?: AssessmentPillar[] }) | null
  pillars: AssessmentPillar[]
  product: Product | null
  lenderProducts: LenderProduct[]
  documents: DocumentRow[]
}) {
  const tenureYears = lead.tenure_years ?? product?.max_tenure_years ?? null

  // No early return. Capacity by method, turnover triangulation and the quality
  // factors are all derived from the product policy, the lead and the parsed
  // documents — they stand up without an assessment. Only the composite ring,
  // verdict, pillars and conditions need one, and those say so individually.
  const hasAssessment = assessment !== null

  // ---- Capacity by method -------------------------------------------------
  // Every surrogate the app can actually compute from stored data. The lowest
  // applicable one governs, exactly as in the prototype.
  const secured = lead.loan_type === 'HL' || lead.loan_type === 'LAP' || lead.loan_type === 'BOTH'
  const maxLtv = product?.max_ltv_percent ?? null
  const ltvCapacity = secured && lead.property_value && maxLtv != null
    ? (Number(lead.property_value) * maxLtv) / 100
    : null
  const lenderCap = lenderProducts.length
    ? Math.max(...lenderProducts.map((lp) => Number(lp.max_sanction_amount)))
    : null

  const methods: CapacityMethod[] = [
    {
      key: 'FOIR',
      label: 'Cash-flow (FOIR)',
      basis: product && lead.monthly_income
        ? `${product.max_foir_percent}% FOIR on ${fmtAmount(Number(lead.monthly_income))} monthly income, less ${fmtAmount(Number(lead.existing_emis))} of existing EMIs${tenureYears ? `, over ${tenureYears} years` : ''}`
        : 'Needs monthly income on the applicant record and an active product policy',
      amount: assessment?.governing_capacity != null ? Number(assessment?.governing_capacity) : null,
      applicable: assessment?.governing_capacity != null,
    },
    {
      key: 'LTV',
      label: 'Loan to value',
      basis: secured
        ? (lead.property_value && maxLtv != null
          ? `${maxLtv}% of the declared property value ${fmtAmount(Number(lead.property_value))}`
          : 'Needs a declared property value and an LTV ceiling on the product')
        : 'Unsecured facility — no collateral offered',
      amount: ltvCapacity,
      applicable: ltvCapacity != null,
    },
    {
      key: 'LENDER_CAP',
      label: 'Lender sanction cap',
      basis: lenderCap != null
        ? `Highest cap across ${lenderProducts.length} active lender product${lenderProducts.length === 1 ? '' : 's'} in the catalogue`
        : 'No lender products in the catalogue for this product family',
      amount: lenderCap,
      applicable: lenderCap != null,
    },
  ]
  const applicableAmounts = methods.filter((m) => m.applicable && m.amount != null).map((m) => m.amount!)
  const governingAmount = applicableAmounts.length ? Math.min(...applicableAmounts) : null
  const governingKey = methods.find((m) => m.applicable && m.amount === governingAmount)?.key ?? null

  // ---- Turnover triangulation --------------------------------------------
  // Only from fields the extractor actually returned. Never synthesised.
  const gstDoc = documents.find((d) => d.type === 'GST_RETURNS' && d.extracted_json)
  const bankDoc = documents.find((d) => d.type === 'BANK_STATEMENT' && d.extracted_json)
  const finDoc = documents.find((d) => d.type === 'FINANCIAL_STATEMENT' && d.extracted_json)

  const gstTurnover = numberField(gstDoc, 'turnover')
  const bankingReceipts = sumNumbers(bankDoc?.extracted_json?.monthly_credits)
  const financialRevenue = numberField(finDoc, 'revenue')

  const triangulationValues = [gstTurnover, bankingReceipts, financialRevenue].filter(
    (v): v is number => v != null && v > 0,
  )
  const spreadPercent = triangulationValues.length >= 2
    ? ((Math.max(...triangulationValues) - Math.min(...triangulationValues)) / Math.max(...triangulationValues)) * 100
    : null
  const triangulationBand: Band | null = spreadPercent == null ? null
    : spreadPercent <= 15 ? 'STRONG'
    : spreadPercent <= 25 ? 'GOOD'
    : spreadPercent <= 40 ? 'MODERATE'
    : 'WEAK'

  const conditions = assessment?.watch_items ?? []
  const knockouts = assessment?.knockouts ?? []

  // Quality signals adjust how much of the assessed capacity we'd stand behind.
  const quality = buildQualityFactors(documents)
  const afterHaircut = assessment?.governing_capacity != null
    ? Number(assessment?.governing_capacity) * (1 - quality.haircutPercent / 100)
    : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHead
          title="Decision"
          sub="Deterministic rules engine — the model extracts, the rules decide"
          right={<RunAssessmentButton kind="lead" id={leadId} disabled={documents.length === 0} />}
        />
        <CardBody className="flex flex-wrap items-center gap-5">
          {assessment ? (
            <>
              <BandRing score={assessment.composite_score} band={assessment.composite_band} size={92} caption="Composite" />
              <div className="min-w-0 flex-1">
                <span className={`inline-block rounded-lg px-2.5 py-1 text-[12px] font-bold text-white ${VERDICT_SOLID[assessment.verdict]}`}>
                  {assessment.verdict}
                </span>
                {assessment.recommendation && (
                  <p className="mt-2.5 text-[13px] leading-relaxed text-[#47453f]">{assessment.recommendation}</p>
                )}
                <p className="mt-2 text-[11px] text-[#7c7a75] tnum">
                  Rules {assessment.rules_version} · {new Date(assessment.computed_at).toLocaleString('en-IN')}
                </p>
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#16161a]">No verdict yet</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#7c7a75]">
                The composite score, verdict and pillar breakdown appear once the assessment is run.
                Everything below is already computed from the product policy and the documents on file.
              </p>
            </div>
          )}
          <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-3">
            <StatTile
              label="Assessed"
              value={assessment?.governing_capacity != null ? fmtAmount(Number(assessment?.governing_capacity)) : '—'}
              sub={assessment?.binding_constraint ?? 'No binding constraint recorded'}
            />
            <StatTile
              label="After quality haircut"
              value={afterHaircut != null ? fmtAmount(afterHaircut) : '—'}
              sub={
                afterHaircut == null
                  // Don't claim a haircut was "applied" when there is no capacity to apply it to.
                  ? (quality.haircutPercent > 0 ? `${quality.haircutPercent}% would apply` : 'No assessed capacity yet')
                  : quality.factors.length === 0 ? 'No quality signals parsed yet'
                  : quality.haircutPercent === 0 ? 'No haircut applied'
                  : `${quality.haircutPercent}% applied`
              }
              band={quality.haircutPercent === 0 ? null : quality.haircutPercent >= 8 ? 'WEAK' : 'MODERATE'}
            />
            <StatTile
              label="Requested"
              value={fmtAmount(Number(lead.requested_amount))}
              sub={tenureYears ? `${tenureYears} year tenure` : 'Tenure not set'}
              band={
                assessment?.governing_capacity != null
                  ? (Number(assessment?.governing_capacity) >= Number(lead.requested_amount) ? 'STRONG' : 'WEAK')
                  : null
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title="Capacity by method"
          sub="All surrogates computed — the lowest applicable one governs"
          icon={<Layers size={16} />}
        />
        <div className="divide-y divide-[#e7e6e2]">
          {methods.map((m) => (
            <div
              key={m.key}
              className={`px-5 py-3.5 ${m.key === governingKey ? 'bg-[#eef1fe]' : ''} ${m.applicable ? '' : 'opacity-45'}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="text-[13px] font-semibold text-[#16161a]">{m.label}</p>
                  {m.key === governingKey && (
                    <span className="rounded-full bg-[#eef1fe] px-2.5 py-1 text-[11px] font-semibold text-[#2440e8]">governs</span>
                  )}
                  {!m.applicable && (
                    <span className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58]">not applicable</span>
                  )}
                </div>
                <p className="shrink-0 text-[13px] font-bold text-[#16161a] tnum">
                  {m.applicable && m.amount != null ? fmtAmount(m.amount) : '—'}
                </p>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#7c7a75]">{m.basis}</p>
              {m.note && <p className="mt-1 text-[11px] text-[#85580d]">{m.note}</p>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHead
              title="Turnover triangulation"
              sub="GST, banking and financials must tell the same story"
              icon={<Scale size={16} />}
              right={
                triangulationBand
                  ? <span className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58]">{triangulationBand.toLowerCase()}</span>
                  : undefined
              }
            />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatTile label="GST returns" value={gstTurnover != null ? fmtAmount(gstTurnover) : '—'} sub={gstTurnover != null ? 'From filed returns' : 'No GST return parsed'} />
                <StatTile label="Banking receipts" value={bankingReceipts != null ? fmtAmount(bankingReceipts) : '—'} sub={bankingReceipts != null ? 'Sum of monthly credits' : 'No bank statement parsed'} />
                <StatTile label="Financials" value={financialRevenue != null ? fmtAmount(financialRevenue) : '—'} sub={financialRevenue != null ? 'Latest reported revenue' : 'No financial statement parsed'} />
              </div>
              {spreadPercent != null && triangulationBand ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 text-[12px] text-[#5f5d58]">Spread</span>
                    <BandBar value={Math.min(100, spreadPercent * 2)} band={triangulationBand} className="h-2 flex-1" />
                    <span className="shrink-0 text-[12px] font-semibold text-[#16161a] tnum">{spreadPercent.toFixed(0)}%</span>
                  </div>
                  <p className="rounded-[20px] bg-[#efeeeb] px-4 py-3 text-[12px] leading-relaxed text-[#47453f]">
                    {spreadPercent <= 25
                      ? 'The declared sources agree within tolerance — turnover can be taken at face value.'
                      : 'The declared sources diverge. Reconcile before the file is logged in.'}
                  </p>
                </>
              ) : (
                <p className="text-[12px] text-[#7c7a75]">
                  Not enough extracted sources to triangulate — at least two of GST returns, bank statement and financial statement must be parsed.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Quality factors"
              sub="Banking, GST and counterparty signals that adjust confidence"
              icon={<Gauge size={16} />}
              right={
                quality.haircutPercent > 0
                  ? <span className="rounded-full bg-[#f7f0e2] px-2.5 py-1 text-[11px] font-semibold text-[#85580d] tnum">
                      {quality.haircutPercent}% haircut
                    </span>
                  : undefined
              }
            />
            <CardBody className="py-1">
              {quality.factors.length === 0 ? (
                <p className="py-3 text-[12px] text-[#7c7a75]">
                  No quality signals yet — these come from a parsed bank statement and GST returns.
                </p>
              ) : (
                quality.factors.map((f) => (
                  <div key={f.label} className="flex items-start gap-3 border-b border-[#dcdbd6]/70 py-2.5 last:border-0">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${BAND_SOLID[f.band]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-medium text-[#16161a]">{f.label}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c7a75]">{f.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-[#5f5d58]">{f.effect}</span>
                      <BandPill band={f.band} size="xs" />
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {knockouts.length > 0 && (
            <Card>
              <CardHead title="Knockouts" sub="Must be cleared before submission" icon={<AlertOctagon size={16} />} />
              <CardBody className="py-1">
                {knockouts.map((k) => (
                  <div key={k} className="border-b border-[#e7e6e2] py-2.5 last:border-0">
                    <p className="text-[12px] font-semibold text-[#b42318]">{k.replaceAll('_', ' ')}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHead title="Pillars" />
            <CardBody className="space-y-3">
              {pillars.length === 0 && <p className="text-[12px] text-[#7c7a75]">No pillar scores on this assessment.</p>}
              {pillars.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="w-[86px] shrink-0 text-[12px] font-medium text-[#47453f]">
                    {PILLAR_LABEL[p.pillar_code] ?? p.pillar_code}
                  </span>
                  <BandBar value={p.score} band={p.band} className="h-1.5 flex-1" />
                  <span className="w-7 shrink-0 text-right text-[11px] text-[#7c7a75] tnum">{Math.round(p.score)}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Terms tested" />
            <CardBody className="py-1">
              <KeyValueRow label="Requested" value={fmtAmount(Number(lead.requested_amount))} mono />
              <KeyValueRow label="Indicative EMI" value={assessment?.proposed_emi != null ? fmtAmount(Number(assessment?.proposed_emi)) : '—'} mono />
              <KeyValueRow label="DSCR at these terms" value={assessment?.dscr != null ? assessment?.dscr.toFixed(2) : '—'} mono />
              <KeyValueRow label="Binding constraint" value={assessment?.binding_constraint ?? '—'} />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Conditions to attach" sub={`${conditions.length} item${conditions.length === 1 ? '' : 's'}`} />
            <CardBody className="py-2">
              {conditions.length === 0 ? (
                <p className="text-[12px] text-[#7c7a75]">No conditions — the file stands on its own.</p>
              ) : (
                <ul className="space-y-2">
                  {conditions.map((c, i) => (
                    <li key={c} className="flex items-start gap-2 text-[11px] leading-relaxed text-[#47453f]">
                      <span className="shrink-0 font-bold text-[#2440e8]">{i + 1}.</span>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
