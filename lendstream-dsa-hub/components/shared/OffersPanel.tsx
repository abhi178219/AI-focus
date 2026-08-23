'use client'

import { useActionState, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Columns3, FileText } from 'lucide-react'
import { addOffer, updateOfferStatus } from '@/app/actions/offers'
import { calculateEmi } from '@/lib/decision/rulesEngine'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Badge } from './Badge'
import { fmtAmount } from '@/lib/format'
import type { LenderOffer, LenderProduct } from '@/lib/types'

type State = { error?: string }

const STATUS_STYLE: Record<LenderOffer['status'], string> = {
  draft: 'bg-[#efeeeb] text-[#47453f]',
  shared: 'bg-[#e8eefd] text-[#2447c9]',
  accepted: 'bg-[#e8f3ee] text-[#16694a]',
  rejected: 'bg-[#fbebeb] text-[#b42318]',
}

const SORTS = [
  { key: 'RATE', label: 'Lowest interest rate' },
  { key: 'SANCTION', label: 'Highest sanction cap' },
  { key: 'EMI', label: 'Lowest monthly EMI' },
] as const

interface RankedOffer {
  id: string
  lender: string
  note: string
  rate: number
  maxSanction: number
  quotedAmount: number
  emi: number
  totalInterest: number
  feePercent: number
  feeAmount: number
  cappedByCapacity: boolean
}

/**
 * Offers tab. The ranked table, the "Best rate" badge and the side-by-side
 * comparison matrix all mirror the prototype. Every figure is derived from a
 * real `lender_products` row plus this lead's requested amount, tenure and
 * assessed capacity — nothing is synthesised. TAT and lender perks have no
 * column in our catalogue, so they render as "—" rather than invented copy.
 */
export function OffersPanel({
  leadId, offers, lenderProducts, requestedAmount, tenureYears, assessedCapacity,
}: {
  leadId: string
  offers: LenderOffer[]
  lenderProducts: LenderProduct[]
  requestedAmount: number
  tenureYears: number
  assessedCapacity: number | null
}) {
  const router = useRouter()
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('RATE')
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [addPending, startAdd] = useTransition()

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await addOffer(leadId, formData)
    if (!result?.error) router.refresh()
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  const alreadyAdded = new Set(offers.map((o) => o.bank_name))

  const ranked = useMemo<RankedOffer[]>(() => {
    const rows = lenderProducts.map((lp) => {
      const lenderCap = Number(lp.max_sanction_amount)
      const capacityCap = assessedCapacity != null && assessedCapacity > 0 ? assessedCapacity : null
      const maxSanction = capacityCap != null ? Math.min(lenderCap, capacityCap) : lenderCap
      const quotedAmount = requestedAmount > 0 ? Math.min(requestedAmount, maxSanction) : maxSanction
      const tenure = Math.min(Math.max(tenureYears, Number(lp.min_tenure_years)), Number(lp.max_tenure_years))
      const emi = calculateEmi(quotedAmount, Number(lp.interest_rate), tenure)
      return {
        id: lp.id,
        lender: lp.lender_name,
        note: lp.display_name,
        rate: Number(lp.interest_rate),
        maxSanction,
        quotedAmount,
        emi,
        totalInterest: Math.max(0, emi * Math.round(tenure * 12) - quotedAmount),
        feePercent: Number(lp.processing_fee_percent),
        feeAmount: (quotedAmount * Number(lp.processing_fee_percent)) / 100,
        cappedByCapacity: capacityCap != null && capacityCap < lenderCap,
      }
    })
    const sorted = [...rows]
    if (sort === 'RATE') sorted.sort((a, b) => a.rate - b.rate)
    if (sort === 'SANCTION') sorted.sort((a, b) => b.maxSanction - a.maxSanction)
    if (sort === 'EMI') sorted.sort((a, b) => a.emi - b.emi)
    return sorted
  }, [lenderProducts, requestedAmount, tenureYears, assessedCapacity, sort])

  const bestRateId = useMemo(
    () => (ranked.length ? [...ranked].sort((a, b) => a.rate - b.rate)[0].id : null),
    [ranked],
  )
  const compared = ranked.filter((r) => selected.includes(r.id))

  function toggleSelected(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function addAsOffer(r: RankedOffer) {
    const fd = new FormData()
    fd.set('bank_name', r.lender)
    fd.set('interest_rate', String(r.rate))
    fd.set('tenure_years', String(tenureYears))
    fd.set('approved_amount', String(Math.round(r.quotedAmount)))
    fd.set('processing_fee_percent', String(r.feePercent))
    startAdd(async () => { await addOffer(leadId, fd); router.refresh() })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHead
          title="Lender offers"
          sub="Ranked by rate — quoted from the partner catalogue against this file"
          icon={<FileText size={16} />}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as (typeof SORTS)[number]['key'])}
                className="h-9 rounded-full bg-[#efeeeb] px-4 text-[12px] font-medium text-[#47453f]"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <button
                type="button"
                disabled={selected.length < 2}
                onClick={() => setCompareOpen((v) => !v)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1a1917] px-3.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                <Columns3 size={14} /> Compare {selected.length} selected offer{selected.length === 1 ? '' : 's'}
              </button>
            </div>
          }
        />
        {ranked.length === 0 ? (
          <CardBody>
            <p className="text-[12.5px] text-[#a8a6a0]">
              No lender products in the catalogue for this product family yet.
            </p>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[#e7e6e2]">
                  {['Lender', 'Rate', 'Max sanction', 'EMI', 'Fee', 'TAT', 'Fit', ''].map((h, i) => (
                    <th
                      key={h || `col-${i}`}
                      className={`px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75] ${i === 0 || i === 7 ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((r) => (
                  <tr key={r.id} className="border-b border-[#e7e6e2] last:border-0 hover:bg-[#efeeeb]/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selected.includes(r.id)}
                            onChange={() => toggleSelected(r.id)}
                            aria-label={`Compare ${r.lender}`}
                            className="h-3.5 w-3.5 accent-[#2440e8]"
                          />
                          <span className="text-[13px] font-semibold text-[#16161a]">{r.lender}</span>
                        </label>
                        {r.id === bestRateId && (
                          <span className="rounded-full bg-[#e8f3ee] px-2.5 py-1 text-[11px] font-semibold text-[#16694a]">Best rate</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[10.5px] text-[#7c7a75]">{r.note}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#16161a] tnum">{r.rate.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right text-[12px] text-[#47453f] tnum">
                      {fmtAmount(r.maxSanction)}
                      {r.cappedByCapacity && <span className="block text-[10px] text-[#7c7a75]">capped by assessed capacity</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-[#47453f] tnum">{fmtAmount(Math.round(r.emi))}</td>
                    <td className="px-4 py-3 text-right text-[12px] text-[#5f5d58] tnum">{r.feePercent}%</td>
                    <td className="px-4 py-3 text-right text-[12px] text-[#c9c7c1]">—</td>
                    <td className="px-4 py-3 text-right text-[12px] text-[#c9c7c1]">—</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={addPending || alreadyAdded.has(r.lender)}
                        onClick={() => addAsOffer(r)}
                        className="h-9 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de] disabled:opacity-50"
                      >
                        {alreadyAdded.has(r.lender) ? 'Added' : 'Select'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {ranked.length > 0 && (
          <CardBody className="pt-3">
            <p className="rounded-[20px] bg-[#efeeeb] px-4 py-3 text-[12px] leading-relaxed text-[#47453f]">
              Offers are indicative, computed from{' '}
              {assessedCapacity != null && assessedCapacity > 0
                ? `the assessed capacity of ${fmtAmount(assessedCapacity)}`
                : `the requested amount of ${fmtAmount(requestedAmount)}`}{' '}
              at a {tenureYears}-year tenure. Final terms are set by the lender after their own underwriting.
              Turnaround time and fit score are not held in the catalogue, so they show as “—”.
            </p>
          </CardBody>
        )}
      </Card>

      {compareOpen && compared.length >= 2 && (
        <Card>
          <CardHead
            title="Side-by-side offer comparison"
            sub={`Comparing ${compared.length} partner lender offers for ${fmtAmount(requestedAmount)} over ${tenureYears} years`}
            icon={<Columns3 size={16} />}
            right={
              <button type="button" onClick={() => setCompareOpen(false)} className="h-9 rounded-full bg-[#efeeeb] px-4 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
                Close comparison
              </button>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#e7e6e2] bg-[#efeeeb]">
                  <th className="min-w-[170px] px-4 py-3 text-[10px] font-bold uppercase tracking-wide text-[#7c7a75]">Comparison parameter</th>
                  {compared.map((c) => (
                    <th key={c.id} className="min-w-[180px] border-l border-[#e7e6e2] px-4 py-3 text-center">
                      <span className="block text-[13px] font-bold text-[#16161a]">{c.lender}</span>
                      {c.id === bestRateId && (
                        <span className="mt-1 inline-block rounded-full bg-[#e8f3ee] px-2 py-0.5 text-[10px] font-semibold text-[#16694a]">Best rate</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e6e2]">
                <MatrixRow label="Interest rate (% p.a.)" cells={compared.map((c) => ({ id: c.id, value: `${c.rate.toFixed(2)}% p.a.` }))} strong />
                <MatrixRow label="Max eligible sanction" cells={compared.map((c) => ({ id: c.id, value: fmtAmount(c.maxSanction) }))} />
                <MatrixRow label={`Monthly EMI (${tenureYears} yrs)`} cells={compared.map((c) => ({ id: c.id, value: `${fmtAmount(Math.round(c.emi))} / mo` }))} />
                <MatrixRow label="Processing fee" cells={compared.map((c) => ({ id: c.id, value: `${fmtAmount(Math.round(c.feeAmount))} (${c.feePercent}%)` }))} />
                <MatrixRow label={`Total interest (${tenureYears} yrs)`} cells={compared.map((c) => ({ id: c.id, value: fmtAmount(Math.round(c.totalInterest)) }))} />
                <MatrixRow label="Turnaround time (TAT)" cells={compared.map((c) => ({ id: c.id, value: '—' }))} />
                <MatrixRow label="Special lender perks" cells={compared.map((c) => ({ id: c.id, value: '—' }))} />
                <tr>
                  <td className="bg-[#efeeeb]/60 px-4 py-4" />
                  {compared.map((c) => (
                    <td key={c.id} className="border-l border-[#e7e6e2] px-4 py-4 text-center">
                      <button
                        type="button"
                        disabled={addPending || alreadyAdded.has(c.lender)}
                        onClick={() => addAsOffer(c)}
                        className="w-full rounded-full bg-[#1a1917] px-3 py-2.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {alreadyAdded.has(c.lender) ? 'Already added' : 'Select offer'}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card>
        <CardHead title="Offers on this file" sub={`${offers.length} recorded`} />
        <CardBody className="space-y-3">
          {offers.length === 0 && <p className="text-[12.5px] text-[#a8a6a0]">No lender offers recorded yet.</p>}
          {offers.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {offers.map((o) => (
                <div key={o.id} className="rounded-[20px] bg-[#efeeeb] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-[#16161a]">{o.bank_name}</span>
                    <Badge className={STATUS_STYLE[o.status]}>{o.status}</Badge>
                  </div>
                  <div className="space-y-1 text-[11.5px] text-[#5f5d58] tnum">
                    <div>Rate {o.interest_rate}% · Tenure {o.tenure_years} yr · Fee {o.processing_fee_percent}%</div>
                    <div>Approved {fmtAmount(Number(o.approved_amount))}</div>
                    {o.emi != null && <div>EMI {fmtAmount(Math.round(Number(o.emi)))} / mo</div>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {o.status === 'draft' && <StatusButton leadId={leadId} offerId={o.id} status="shared" label="Share" />}
                    {o.status === 'shared' && <StatusButton leadId={leadId} offerId={o.id} status="accepted" label="Mark accepted" />}
                    {(o.status === 'draft' || o.status === 'shared') && <StatusButton leadId={leadId} offerId={o.id} status="rejected" label="Reject" />}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-[20px] border border-dashed border-[#dcdbd6] p-4">
            <Field label="Bank"><input name="bank_name" required className="h-9 w-32 rounded-lg bg-[#efeeeb] px-3 text-[13px]" /></Field>
            <Field label="Rate (%)"><input name="interest_rate" type="number" step="0.01" required className="h-9 w-24 rounded-lg bg-[#efeeeb] px-3 text-[13px] tnum" /></Field>
            <Field label="Tenure (yrs)"><input name="tenure_years" type="number" step="0.5" required className="h-9 w-24 rounded-lg bg-[#efeeeb] px-3 text-[13px] tnum" /></Field>
            <Field label="Approved amount (₹)"><input name="approved_amount" type="number" required className="h-9 w-40 rounded-lg bg-[#efeeeb] px-3 text-[13px] tnum" /></Field>
            <Field label="Processing fee (%)"><input name="processing_fee_percent" type="number" step="0.1" defaultValue={1} className="h-9 w-24 rounded-lg bg-[#efeeeb] px-3 text-[13px] tnum" /></Field>
            <button type="submit" disabled={pending} className="h-9 rounded-full bg-[#1a1917] px-4 text-[12px] font-semibold text-white disabled:opacity-60">
              {pending ? 'Adding…' : 'Add offer manually'}
            </button>
            {state?.error && <p className="w-full text-[12px] text-[#b42318]">{state.error}</p>}
          </form>
        </CardBody>
      </Card>
    </div>
  )
}

function MatrixRow({ label, cells, strong }: { label: string; cells: { id: string; value: string }[]; strong?: boolean }) {
  return (
    <tr>
      <td className="bg-[#efeeeb]/60 px-4 py-3 text-[12px] font-bold text-[#16161a]">{label}</td>
      {cells.map((c) => (
        <td
          key={c.id}
          className={`border-l border-[#e7e6e2] px-4 py-3 text-center tnum ${
            c.value === '—' ? 'text-[#c9c7c1]' : strong ? 'text-[13px] font-bold text-[#2440e8]' : 'text-[#47453f]'
          }`}
        >
          {c.value}
        </td>
      ))}
    </tr>
  )
}

function StatusButton({ leadId, offerId, status, label }: { leadId: string; offerId: string; status: LenderOffer['status']; label: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      onClick={() => startTransition(async () => { await updateOfferStatus(leadId, offerId, status); router.refresh() })}
      disabled={pending}
      className="rounded-full bg-[#f7f6f4] px-2.5 py-1 text-[11.5px] font-medium text-[#5f5d58] hover:bg-[#e3e2de] disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-[#7c7a75]">{label}</label>
      {children}
    </div>
  )
}
