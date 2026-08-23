'use client'

import { useMemo, useState } from 'react'
import { Zap, RotateCcw } from 'lucide-react'
import { calculateEmi, reverseEmiToPrincipal } from '@/lib/decision/rulesEngine'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import type { Product } from '@/lib/types'

interface Slab {
  id: string
  bank_name: string
  product_category: string
  slab_min_amount: number
  slab_max_amount: number | null
  commission_percent: number
}

const TENURE_OPTIONS = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30]

const CIBIL_BANDS = [
  { min: 780, label: '780+ (Excellent)', short: '780+ EXCELLENT' },
  { min: 740, label: '740–779 (Good)', short: '740-779 GOOD' },
  { min: 700, label: '700–739 (Fair)', short: '700-739 FAIR' },
  { min: 650, label: '650–699 (Low)', short: '650-699 LOW' },
  { min: 300, label: 'Below 650 (Poor)', short: 'BELOW 650 POOR' },
]
const cibilBand = (s: number) => CIBIL_BANDS.find((b) => s >= b.min) ?? CIBIL_BANDS[CIBIL_BANDS.length - 1]

type SortKey = 'rate' | 'sanction' | 'emi' | 'commission'
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'rate', label: 'Lowest interest rate' },
  { key: 'sanction', label: 'Highest sanction cap' },
  { key: 'emi', label: 'Lowest monthly EMI' },
  { key: 'commission', label: 'Highest commission' },
]

export function FoirCalculator({
  products, slabs, category = null, combo = false,
}: {
  products: Product[]
  slabs: Slab[]
  /** Product family to size against. null + combo shows every family together. */
  category?: string | null
  /** Combo (PL + HL) sizes against the most generous FOIR across families. */
  combo?: boolean
}) {
  const categoryProducts = useMemo(() => {
    if (combo || !category) return products
    return products.filter((p) => p.category === category)
  }, [products, category, combo])

  const [productId, setProductId] = useState('')
  const product = categoryProducts.find((p) => p.id === productId) ?? categoryProducts[0]

  // Starting positions for a what-if tool — not data about any applicant.
  const [income, setIncome] = useState(85000)
  const [existingEmis, setExistingEmis] = useState(10000)
  const [cibil, setCibil] = useState(750)
  const [tenure, setTenure] = useState(5)
  const [rateOverride, setRateOverride] = useState<string>('')
  const [coApplicant, setCoApplicant] = useState(false)
  const [coIncome, setCoIncome] = useState(0)
  const [sort, setSort] = useState<SortKey>('emi')
  const [compare, setCompare] = useState<Set<string>>(new Set())
  const [runId, setRunId] = useState(1)

  const householdIncome = income + (coApplicant ? coIncome : 0)
  const productRate = product ? (product.min_interest_rate + product.max_interest_rate) / 2 : null
  const rate = rateOverride !== '' && Number.isFinite(Number(rateOverride)) ? Number(rateOverride) : productRate

  const result = useMemo(() => {
    if (!product || rate === null || income <= 0 || tenure <= 0) return null
    const capacity = (householdIncome * product.max_foir_percent) / 100
    const maxEmiCapacity = capacity - existingEmis
    if (maxEmiCapacity <= 0) return { eligibleAmount: 0, maxEmiCapacity: 0, foirUsedPercent: 100, capacity }
    const eligibleAmount = reverseEmiToPrincipal(maxEmiCapacity, rate, tenure)
    const foirUsedPercent = Math.min(100, (existingEmis / (householdIncome || 1)) * 100 + (maxEmiCapacity / (householdIncome || 1)) * 100)
    return { eligibleAmount, maxEmiCapacity, foirUsedPercent, capacity }
  }, [product, rate, householdIncome, existingEmis, tenure])

  const offers = useMemo(() => {
    if (!product || !result || rate === null || result.eligibleAmount <= 0) return []
    const list = slabs
      .filter((s) => s.product_category === product.category)
      .map((s) => {
        const amount = Math.max(s.slab_min_amount, Math.min(result.eligibleAmount, s.slab_max_amount ?? result.eligibleAmount))
        return {
          slab: s,
          amount,
          emi: calculateEmi(amount, rate, tenure),
          rate,
          fee: (amount * product.default_processing_fee_percent) / 100,
          feePct: product.default_processing_fee_percent,
          commission: (amount * s.commission_percent) / 100,
        }
      })
    const sorted = [...list]
    if (sort === 'rate') sorted.sort((a, b) => a.rate - b.rate || a.emi - b.emi)
    if (sort === 'sanction') sorted.sort((a, b) => b.amount - a.amount)
    if (sort === 'emi') sorted.sort((a, b) => a.emi - b.emi)
    if (sort === 'commission') sorted.sort((a, b) => b.commission - a.commission)
    return sorted
  }, [slabs, product, result, rate, tenure, sort])

  const bestCommission = offers.length ? Math.max(...offers.map((o) => o.commission)) : 0
  const bestSanction = offers.length ? Math.max(...offers.map((o) => o.amount)) : 0
  const lowestEmi = offers.length ? Math.min(...offers.map((o) => o.emi)) : 0

  function reset() {
    setIncome(0); setExistingEmis(0); setCibil(0); setTenure(0)
    setRateOverride(''); setCoApplicant(false); setCoIncome(0); setCompare(new Set())
  }

  const band = cibilBand(cibil)
  const compared = offers.filter((o) => compare.has(o.slab.id))

  return (
    <div className="space-y-4">
      <Card>
        <CardHead
          title="Eligibility Check & Calculator"
          sub="Instant tentative loan limit assessment using this product's FOIR and rate rules"
          right={
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7c7a75]">
                Run #{runId}
              </span>
              <button onClick={() => setRunId((r) => r + 1)} className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1917] px-3 py-1.5 text-[11.5px] font-semibold text-white hover:opacity-90">
                <Zap size={12} /> Rerun
              </button>
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          }
        />
        <CardBody>
          {categoryProducts.length === 0 && (
            <p className="mb-4 rounded-[20px] bg-[#efeeeb] p-4 text-[12.5px] text-[#7c7a75]">
              No active product configured for this family yet — add one on the Products page.
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <Slider label="Net monthly salary" value={income} onChange={setIncome} min={20000} max={500000} step={5000} format={fmtRupee} />

              <div className="rounded-[20px] bg-[#efeeeb] p-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-[#16161a]">Add spouse / co-applicant income?</p>
                    <p className="text-[11px] text-[#7c7a75]">Boosts eligibility by combining household income</p>
                  </div>
                  <button
                    onClick={() => setCoApplicant((v) => !v)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${coApplicant ? 'bg-[#1a1917] text-white' : 'bg-white text-[#47453f] hover:bg-[#f7f6f4]'}`}
                  >
                    {coApplicant ? 'Remove' : '+ Add co-applicant'}
                  </button>
                </div>
                {coApplicant && (
                  <div className="mt-3">
                    <Slider label="Co-applicant income" value={coIncome} onChange={setCoIncome} min={0} max={300000} step={5000} format={fmtRupee} />
                  </div>
                )}
              </div>

              <Slider label="Current existing EMIs" value={existingEmis} onChange={setExistingEmis} min={0} max={150000} step={1000} format={fmtRupee} />

              <div>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <label className="font-semibold text-[#16161a]">Approx. CIBIL / credit score</label>
                  <span className="rounded-full bg-[#efeeeb] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#47453f]">{band.short}</span>
                </div>
                <input type="range" min={300} max={900} step={10} value={cibil} onChange={(e) => setCibil(Number(e.target.value))} className="w-full accent-[#1a1917]" />
                <div className="flex justify-between text-[10px] text-[#a8a6a0]"><span>300</span><span className="font-semibold text-[#5f5d58] tnum">{cibil}</span><span>900</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#16161a]">Loan tenure</label>
                  <select value={tenure} onChange={(e) => setTenure(Number(e.target.value))} className="w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px]">
                    <option value={0}>Select tenure</option>
                    {TENURE_OPTIONS.filter((t) => !product || (t >= product.min_tenure_years && t <= product.max_tenure_years)).map((t) => (
                      <option key={t} value={t}>{t} {t === 1 ? 'Year' : 'Years'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#16161a]">Expected interest rate</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" step="0.05" value={rateOverride}
                      onChange={(e) => setRateOverride(e.target.value)}
                      placeholder={productRate?.toFixed(2) ?? ''}
                      className="w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px]"
                    />
                    <span className="text-[11px] text-[#7c7a75]">% p.a.</span>
                  </div>
                </div>
              </div>

              {categoryProducts.length > 1 && (
                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#16161a]">Product</label>
                  <select value={product?.id ?? ''} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px]">
                    {categoryProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (max FOIR {p.max_foir_percent}%)</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="rounded-[20px] bg-[#1a1917] p-6 text-white">
              <div className="mb-1 flex items-center justify-between text-[10.5px] uppercase tracking-wide text-white/50">
                <span>Estimated max loan cap</span>
                <span className="text-[#d6f34b]">FOIR {product?.max_foir_percent ?? '—'}% cap</span>
              </div>
              <div className="mb-1 text-[32px] font-bold tnum leading-none">
                {result ? `₹${(Math.max(0, result.eligibleAmount) / 100000).toFixed(2)} Lakhs` : '—'}
              </div>
              <div className="mb-5 text-[13px] text-white/60 tnum">
                Estimated monthly EMI: {result ? `₹${Math.round(result.maxEmiCapacity).toLocaleString('en-IN')}` : '—'} / mo
              </div>

              <div className="mb-1 flex items-center justify-between text-[11px] text-white/50">
                <span>FOIR obligation gauge</span>
                <span className="text-[#d6f34b] tnum">{result ? `${result.foirUsedPercent.toFixed(0)}% used` : '—'}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[#d6f34b] transition-[width] duration-500" style={{ width: `${result?.foirUsedPercent ?? 0}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-white/40">
                <span>0%</span><span>{product?.max_foir_percent}% (max cap)</span><span>100%</span>
              </div>

              <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-[12px]">
                <DarkRow label={`CIBIL (${cibil})`} value={band.label} />
                <DarkRow label="Household income" value={fmtRupee(householdIncome)} />
                <DarkRow label="Rate applied" value={rate !== null ? `${rate.toFixed(2)}% p.a.` : '—'} />
                <DarkRow label="Partner banks" value={`${offers.length} configured`} />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title="Partner bank offers"
          sub={`Based on assessment run #${runId} — sanction, EMI and your commission per configured slab`}
          right={
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-full border border-[#dcdbd6] bg-[#f7f6f4] px-3 py-1.5 text-[11.5px] text-[#47453f]">
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          }
        />
        <CardBody>
          {offers.length === 0 ? (
            <p className="text-[13px] text-[#a8a6a0]">
              No commission slabs configured for {product?.category ?? 'this product'} yet — add them in Analytics to see partner bank offers here.
            </p>
          ) : (
            <>
              {compared.length > 1 && (
                <div className="mb-4 overflow-x-auto rounded-[20px] border border-[#dcdbd6]">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="border-b border-[#dcdbd6] bg-[#efeeeb] text-left text-[10px] uppercase tracking-wide text-[#7c7a75]">
                        <th className="px-4 py-2">Bank</th><th className="px-4 py-2">Rate</th><th className="px-4 py-2">Sanction</th>
                        <th className="px-4 py-2">EMI</th><th className="px-4 py-2">Fee</th><th className="px-4 py-2">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compared.map((o) => (
                        <tr key={o.slab.id} className="border-b border-[#e7e6e2] last:border-0">
                          <td className="px-4 py-2 font-semibold text-[#16161a]">{o.slab.bank_name}</td>
                          <td className="px-4 py-2 tnum">{o.rate.toFixed(2)}%</td>
                          <td className="px-4 py-2 tnum">₹{Math.round(o.amount).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 tnum">₹{Math.round(o.emi).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 tnum">₹{Math.round(o.fee).toLocaleString('en-IN')}</td>
                          <td className="px-4 py-2 font-semibold text-[#16694a] tnum">₹{Math.round(o.commission).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {offers.map((o) => {
                  const badge = o.commission === bestCommission ? 'Highest commission'
                    : o.amount === bestSanction ? 'Highest sanction'
                    : o.emi === lowestEmi ? 'Lowest EMI' : null
                  const selected = compare.has(o.slab.id)
                  return (
                    <div key={o.slab.id} className={`rounded-[20px] p-4 transition-colors ${selected ? 'bg-[#e3e2de] ring-1 ring-[#16161a]/15' : 'bg-[#efeeeb]'}`}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#16161a]">{o.slab.bank_name}</p>
                          <p className="text-[10.5px] text-[#7c7a75]">
                            Slab ₹{(o.slab.slab_min_amount / 1e5).toFixed(1)}L–{o.slab.slab_max_amount ? `₹${(o.slab.slab_max_amount / 1e5).toFixed(1)}L` : '∞'}
                          </p>
                        </div>
                        {badge && <span className="shrink-0 rounded-full bg-[#d6f34b] px-2 py-0.5 text-[9.5px] font-bold uppercase text-[#4a5c07]">{badge}</span>}
                      </div>
                      <dl className="space-y-1 text-[11.5px] text-[#5f5d58]">
                        <Line label="Interest rate" value={`${o.rate.toFixed(2)}% p.a.`} />
                        <Line label="Eligible sanction" value={`₹${Math.round(o.amount).toLocaleString('en-IN')}`} />
                        <Line label="Monthly EMI" value={`₹${Math.round(o.emi).toLocaleString('en-IN')}`} />
                        <Line label="Processing fee" value={`₹${Math.round(o.fee).toLocaleString('en-IN')} (${o.feePct}%)`} />
                        <Line label="Your commission" value={`₹${Math.round(o.commission).toLocaleString('en-IN')} (${o.slab.commission_percent}%)`} accent />
                      </dl>
                      <button
                        onClick={() => setCompare((prev) => { const n = new Set(prev); n.has(o.slab.id) ? n.delete(o.slab.id) : n.add(o.slab.id); return n })}
                        className={`mt-3 w-full rounded-full py-1.5 text-[11.5px] font-semibold ${selected ? 'bg-[#1a1917] text-white' : 'bg-white text-[#47453f] hover:bg-[#f7f6f4]'}`}
                      >
                        {selected ? 'Comparing ✓' : 'Compare'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function fmtRupee(v: number) { return v > 0 ? `₹${v.toLocaleString('en-IN')}` : '—' }

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[#7c7a75]">{label}</span>
      <span className={`font-semibold tnum ${accent ? 'text-[#16694a]' : 'text-[#16161a]'}`}>{value}</span>
    </div>
  )
}

function DarkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white tnum">{value}</span>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; format: (v: number) => string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px]">
        <label className="font-semibold text-[#16161a]">{label}</label>
        <span className="font-bold text-[#16161a] tnum">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#1a1917]" />
      <div className="flex justify-between text-[10px] text-[#a8a6a0]"><span>{format(min)}</span><span>{format(max)}</span></div>
    </div>
  )
}
