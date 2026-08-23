'use client'

import { useMemo, useState } from 'react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import {
  UBL_BASES, UBL_DEFAULTS, BUSINESS_TYPES, ublCalculate,
  type UblBasis, type UblState, type BusinessType,
} from '@/lib/decision/unsecuredBl'

const money = (v: number) => v > 0 ? `₹${Math.max(0, Math.round(v)).toLocaleString('en-IN')}` : '—'
const fieldClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] tnum focus:border-[#16161a] focus:outline-none'

export function UnsecuredBlCalculator() {
  // A calculator is a what-if tool, not a record of anyone's file — these are
  // starting positions the user drags away from, and the policy constants
  // (FOIR factors, multipliers, tenure) are lender policy, not applicant data.
  // Zeroing them makes the model incapable of producing any number at all.
  const [s, setS] = useState<UblState>(UBL_DEFAULTS)
  const [basis, setBasis] = useState<UblBasis>('ABB')
  const [compare, setCompare] = useState<UblBasis[]>(['ABB', 'GST', 'UNAUDITED', 'AUDITED'])
  const [showVars, setShowVars] = useState(false)

  const set = <K extends keyof UblState>(k: K, v: UblState[K]) => setS((p) => ({ ...p, [k]: v }))
  const setLoan = (i: number, k: 'emi' | 'paid', v: number) =>
    setS((p) => ({ ...p, loans: p.loans.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)) }))

  const result = useMemo(() => ublCalculate(s, basis), [s, basis])
  const current = UBL_BASES.find((b) => b.key === basis)!

  const cibilOk = s.cibil >= 700
  const ageOk = s.organisationAge >= 3
  const cibilProvided = s.cibil > 0
  const ageProvided = s.organisationAge > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHead
          title="Eligibility calculator"
          sub="Use the four workbook-backed assessment bases to size an indicative business loan."
          right={<span className="rounded-full bg-[#efeeeb] px-3 py-1 text-[11px] font-semibold text-[#47453f]">{current.label}</span>}
        />
        <CardBody>
          <div className="mb-4 flex flex-wrap gap-1 rounded-full bg-[#efeeeb] p-1" role="tablist">
            {UBL_BASES.map((b) => (
              <button
                key={b.key}
                role="tab"
                aria-selected={b.key === basis}
                onClick={() => setBasis(b.key)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${basis === b.key ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#e3e2de]'}`}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <Section title="Applicant and business inputs" note={`${current.short} basis`}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Num label="Desired loan amount" value={s.desiredLoan} onChange={(v) => set('desiredLoan', v)} step={50000} />
                  <Field label="Business type">
                    <select value={s.businessType} onChange={(e) => set('businessType', e.target.value as BusinessType)} className={fieldClass}>
                      <option value="">Select business type</option>
                      {BUSINESS_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Num label="Organisation age (years)" value={s.organisationAge} onChange={(v) => set('organisationAge', v)} step={1} />
                  <Num label="CIBIL score" value={s.cibil} onChange={(v) => set('cibil', v)} step={1} min={300} max={900} />
                  <Num label="Loans taken in last 12 months" value={s.loansTaken} onChange={(v) => set('loansTaken', v)} step={1} min={0} max={6} />
                  <Num label="Active unsecured loans" value={s.activeLoans} onChange={(v) => set('activeLoans', v)} step={1} min={0} max={4} />
                </div>
              </Section>

              <Section title="Loan obligations" note="Up to six running loans">
                <div className="space-y-2">
                  {s.loans.map((l, i) => (
                    <div key={i} className="grid grid-cols-[64px_1fr_1fr] items-center gap-3">
                      <span className="text-[11.5px] font-semibold text-[#7c7a75]">Loan {i + 1}</span>
                      <Num label="Monthly EMI" value={l.emi} onChange={(v) => setLoan(i, 'emi', v)} step={1000} compact />
                      <Num label="EMIs paid" value={l.paid} onChange={(v) => setLoan(i, 'paid', v)} step={1} min={0} max={s.tenure} compact />
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Financial inputs" note="Update the variables used for this assessment">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Num label="Last FY audited income / turnover" value={s.auditedIncome} onChange={(v) => set('auditedIncome', v)} step={100000} />
                  <Num label="Profit after tax" value={s.pat} onChange={(v) => set('pat', v)} step={100000} />
                  <Num label="GST turnover (last 12 months)" value={s.gstTurnover} onChange={(v) => set('gstTurnover', v)} step={100000} />
                  <Num label="Average bank balance" value={s.avgBanking} onChange={(v) => set('avgBanking', v)} step={10000} />
                  <Num label="Interest on EMI-based loan" value={s.interestLoan} onChange={(v) => set('interestLoan', v)} step={10000} />
                  <Num label="Depreciation" value={s.depreciation} onChange={(v) => set('depreciation', v)} step={10000} />
                  <Num label="Director / partner remuneration" value={s.remuneration} onChange={(v) => set('remuneration', v)} step={10000} />
                  <Num label="Interest on capital" value={s.capitalInterest} onChange={(v) => set('capitalInterest', v)} step={10000} />
                </div>
              </Section>

              <div className="rounded-[20px] bg-[#efeeeb] p-4">
                <button onClick={() => setShowVars((v) => !v)} className="flex w-full items-center justify-between text-[12.5px] font-semibold text-[#16161a]">
                  Calculation variables
                  <span className="text-[#7c7a75]">{showVars ? '−' : '+'}</span>
                </button>
                {showVars && (
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Num label="Rate of interest (% p.a.)" value={s.rate} onChange={(v) => set('rate', v)} step={0.25} />
                    <Num label="Tenure (months)" value={s.tenure} onChange={(v) => set('tenure', v)} step={1} min={1} />
                    <Num label="Obligation window (months)" value={s.obligationMonths} onChange={(v) => set('obligationMonths', v)} step={1} min={1} />
                    <Num label="ABB capacity (% of banking)" value={s.abbCapacityPct} onChange={(v) => set('abbCapacityPct', v)} step={1} />
                    <Num label="ABB eligibility factor (%)" value={s.abbEligibilityPct} onChange={(v) => set('abbEligibilityPct', v)} step={1} />
                    <Num label="GST FOIR factor (%)" value={s.gstFoirPct} onChange={(v) => set('gstFoirPct', v)} step={1} />
                    <Num label="PAT policy multiplier" value={s.patMultiplier} onChange={(v) => set('patMultiplier', v)} step={0.25} />
                    <Num label="Audited revenue multiplier" value={s.auditedMultiplier} onChange={(v) => set('auditedMultiplier', v)} step={0.25} />
                    <Num label="Remuneration add-back (%)" value={s.remunerationPct} onChange={(v) => set('remunerationPct', v)} step={1} min={0} max={100} />
                  </div>
                )}
              </div>
            </div>

            {/* Result rail */}
            <aside className="space-y-3">
              <div className="rounded-[20px] bg-[#1a1917] p-5 text-white">
                <p className="text-[10px] uppercase tracking-wide text-white/50">Indicative eligibility</p>
                <p className="mt-1 text-[28px] font-bold leading-none tnum">
                  {result.policy.eligible ? money(result.finalEligibility) : 'Not eligible'}
                </p>
                {!result.policy.eligible && result.policy.reason && (
                  <p className="mt-1.5 text-[11.5px] text-[#f8ece5]">{result.policy.reason}</p>
                )}
                {result.policy.eligible && (
                  <p className="mt-1.5 text-[11px] text-white/50 tnum">
                    Computed {money(result.calculated)} · policy cap {money(result.policy.cap)}
                  </p>
                )}
              </div>

              <div className="rounded-[20px] bg-[#efeeeb] p-4">
                <Metric label="EMI for desired amount" value={`${money(result.requestedEmi)} / month`} />
                <Metric label="EMI at eligible amount" value={result.policy.eligible ? `${money(result.eligibleEmi)} / month` : '—'} />
                <Metric label="Balance obligations" value={money(result.obligation)} />
              </div>

              <div className="rounded-[20px] bg-[#efeeeb] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Calculation driver</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#47453f]">{result.driver}</p>
              </div>

              <div className="rounded-[20px] bg-[#efeeeb] p-4">
                <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Quick checks</p>
                <p className={`mt-1.5 text-[12px] font-medium ${!cibilProvided ? 'text-[#7c7a75]' : cibilOk ? 'text-[#16694a]' : 'text-[#b42318]'}`}>
                  ● CIBIL {!cibilProvided ? 'not provided' : cibilOk ? 'meets' : 'below'} 700 minimum
                </p>
                <p className={`text-[12px] font-medium ${!ageProvided ? 'text-[#7c7a75]' : ageOk ? 'text-[#16694a]' : 'text-[#b42318]'}`}>
                  ● Organisation age {!ageProvided ? 'not provided' : ageOk ? 'meets' : 'below'} 3 years
                </p>
              </div>

              <p className="px-1 text-[10.5px] leading-relaxed text-[#a8a6a0]">
                Indicative only. Final eligibility is subject to document verification, lender policy and underwriting.
              </p>
            </aside>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Compare assessment methods" sub="Select any combination for a quick glance" />
        <CardBody>
          <div className="mb-3 flex flex-wrap gap-3">
            {UBL_BASES.map((b) => (
              <label key={b.key} className="inline-flex items-center gap-1.5 text-[12.5px] text-[#47453f]">
                <input
                  type="checkbox"
                  checked={compare.includes(b.key)}
                  onChange={(e) => setCompare((prev) => e.target.checked ? [...prev, b.key] : prev.filter((k) => k !== b.key))}
                  className="h-3.5 w-3.5 accent-[#1a1917]"
                />
                {b.short}
              </label>
            ))}
          </div>

          {compare.length === 0 ? (
            <p className="text-[12.5px] text-[#a8a6a0]">Select at least one method to compare.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {UBL_BASES.filter((b) => compare.includes(b.key)).map((b) => {
                const r = ublCalculate(s, b.key)
                return (
                  <article key={b.key} className={`rounded-[20px] p-4 ${b.key === basis ? 'bg-[#e3e2de] ring-1 ring-[#16161a]/15' : 'bg-[#efeeeb]'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#7c7a75]">{b.short}</p>
                    <h4 className="text-[12.5px] font-semibold text-[#16161a]">{b.label}</h4>
                    <strong className="mt-2 block text-[17px] font-bold text-[#16161a] tnum">
                      {r.policy.eligible ? money(r.finalEligibility) : 'Not eligible'}
                    </strong>
                    <p className="mt-1 text-[11px] leading-snug text-[#7c7a75]">
                      {r.policy.eligible ? `${money(r.eligibleEmi)} / month eligible EMI` : r.policy.reason}
                    </p>
                  </article>
                )
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-[#efeeeb] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-semibold text-[#16161a]">{title}</span>
        {note && <span className="text-[10.5px] text-[#7c7a75]">{note}</span>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">{label}</label>
      {children}
    </div>
  )
}

function Num({ label, value, onChange, step = 1, min, max, compact }: {
  label: string; value: number; onChange: (v: number) => void
  step?: number; min?: number; max?: number; compact?: boolean
}) {
  return (
    <div className="min-w-0">
      <label className={`mb-1 block font-medium text-[#7c7a75] ${compact ? 'text-[10px]' : 'text-[10.5px]'}`}>{label}</label>
      <input
        type="number" value={value} step={step} min={min} max={max}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={fieldClass}
      />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#dcdbd6] py-1.5 last:border-0">
      <span className="text-[11.5px] text-[#7c7a75]">{label}</span>
      <span className="text-[12px] font-semibold text-[#16161a] tnum">{value}</span>
    </div>
  )
}
