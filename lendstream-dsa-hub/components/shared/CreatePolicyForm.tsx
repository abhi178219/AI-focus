'use client'

import { useActionState, useState } from 'react'
import { createPolicy } from '@/app/actions/policies'
import { DOC_CATEGORIES, DOC_TYPE_LABEL } from '@/lib/documentCategories'
import {
  COLLATERAL_PRODUCTS, LOAN_TYPE_LABEL, POLICY_PRODUCTS,
  POLICY_HARD_DECLINE_TRIGGERS, POLICY_REFER_TRIGGERS, type PolicyProduct,
} from '@/lib/types'

type State = { error?: string }

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] focus:border-[#16161a] focus:outline-none'

/**
 * Authors a new DRAFT policy version. Open to any signed-in user — creating
 * a draft is not a publish-control action (see 028_policies_open_create.sql).
 * Activating, pausing or duplicating a published version is still ops-admin
 * only, gated in PolicyDetail.
 */
export function CreatePolicyForm() {
  const [product, setProduct] = useState<PolicyProduct | ''>('')

  async function action(_prev: State, formData: FormData): Promise<State> {
    // createPolicy redirects to the new draft on success, so anything it
    // returns is an error.
    const result = await createPolicy(formData)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  const collateralApplies = product === '' || COLLATERAL_PRODUCTS.includes(product)

  return (
    <form action={formAction} className="space-y-3">
      <Section
        title="Identity & applicability"
        sub="The policy code is the stable identity across versions — reuse it to revise an existing policy."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Policy code"><input name="policy_code" required placeholder="PL-STD" className={inputClass} /></Field>
          <Field label="Policy name"><input name="name" required placeholder="Personal Loan — standard credit box" className={inputClass} /></Field>
          <Field label="Product">
            <select
              name="product" required defaultValue="" className={inputClass}
              onChange={(e) => setProduct(e.target.value as PolicyProduct | '')}
            >
              <option value="" disabled>Select…</option>
              {POLICY_PRODUCTS.map((p) => <option key={p} value={p}>{LOAN_TYPE_LABEL[p] ?? p}</option>)}
            </select>
          </Field>
          <Field label="Priority (lower runs first)"><input name="priority" type="number" defaultValue={100} className={inputClass} /></Field>
          <Field label="Effective from"><input name="effective_from" type="date" className={inputClass} /></Field>
          <Field label="Effective to"><input name="effective_to" type="date" className={inputClass} /></Field>
          <Field label="Description"><input name="description" placeholder="Standard salaried credit box" className={inputClass} /></Field>
          <Field label="Change reason"><input name="change_reason" placeholder="Initial policy" className={inputClass} /></Field>
        </div>
      </Section>

      <Section title="Applicant" sub="Who this policy is written for.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Minimum age"><input name="age_min" type="number" placeholder="21" className={inputClass} /></Field>
          <Field label="Maximum age"><input name="age_max" type="number" placeholder="60" className={inputClass} /></Field>
          <Field label="Min employment vintage (yrs)"><input name="min_employment_vintage_years" type="number" step="0.5" placeholder="2" className={inputClass} /></Field>
          <div />
          <CheckGroup label="Employment types" name="employment_types" options={{ SALARIED: 'Salaried', SELF_EMPLOYED: 'Self-employed' }} />
          <CheckGroup label="Residency" name="residency" options={{ RESIDENT: 'Resident', NRI: 'NRI' }} />
        </div>
      </Section>

      <Section title="Financial & affordability" sub="Income treatment and obligation limits.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Min monthly income (₹)"><input name="min_monthly_income" type="number" placeholder="30000" className={inputClass} /></Field>
          <Field label="Income averaging (months)"><input name="income_averaging_months" type="number" placeholder="6" className={inputClass} /></Field>
          <Field label="Variable income haircut (%)"><input name="variable_income_haircut_percent" type="number" step="0.5" placeholder="50" className={inputClass} /></Field>
          <Field label="Obligation haircut (%)"><input name="obligation_haircut_percent" type="number" step="0.5" placeholder="0" className={inputClass} /></Field>
          <Field label="Max FOIR (%)"><input name="max_foir_percent" type="number" step="0.5" placeholder="55" className={inputClass} /></Field>
          <Field label="Max DTI (%)"><input name="max_dti_percent" type="number" step="0.5" placeholder="45" className={inputClass} /></Field>
        </div>
      </Section>

      <Section title="Bureau & repayment" sub="Score cutoffs and adverse-history treatment.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Min bureau score"><input name="min_bureau_score" type="number" placeholder="700" className={inputClass} /></Field>
          <Field label="Thin-file treatment">
            <select name="thin_file_treatment" defaultValue="" className={inputClass}>
              <option value="">Not set</option>
              <option value="REFER">Refer</option>
              <option value="DECLINE">Decline</option>
              <option value="MANUAL_REVIEW">Manual review</option>
            </select>
          </Field>
          <Field label="Max 30+ DPD count"><input name="max_dpd_30_count" type="number" placeholder="2" className={inputClass} /></Field>
          <Field label="Max 90+ DPD count"><input name="max_dpd_90_count" type="number" placeholder="0" className={inputClass} /></Field>
          <Field label="Max enquiries (last 6m)"><input name="max_enquiries_last_6m" type="number" placeholder="6" className={inputClass} /></Field>
          <div className="min-w-0 sm:col-span-2">
            <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Adverse history</label>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-[#dcdbd6] bg-white px-3 py-2.5">
              <label className="inline-flex items-center gap-1.5 text-[12px] text-[#47453f]">
                <input type="checkbox" name="exclude_write_off" className="h-3.5 w-3.5 rounded border-[#dcdbd6] accent-[#1a1917]" />
                Exclude write-offs
              </label>
              <label className="inline-flex items-center gap-1.5 text-[12px] text-[#47453f]">
                <input type="checkbox" name="exclude_settlement" className="h-3.5 w-3.5 rounded border-[#dcdbd6] accent-[#1a1917]" />
                Exclude settlements
              </label>
            </div>
          </div>
        </div>
      </Section>

      {collateralApplies && (
        <Section
          title="Collateral"
          sub={product === ''
            ? 'Mainly applies to Home Loan, Loan Against Property and Working Capital.'
            : `Security norms for ${LOAN_TYPE_LABEL[product] ?? product}.`}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Max LTV (%)"><input name="max_ltv_percent" type="number" step="0.5" placeholder="75" className={inputClass} /></Field>
            <Field label="Min property value (₹)"><input name="min_property_value" type="number" placeholder="2500000" className={inputClass} /></Field>
            <Field label="Max valuation age (months)"><input name="valuation_age_max_months" type="number" placeholder="6" className={inputClass} /></Field>
            <div />
            <CheckGroup
              label="Accepted collateral types" name="accepted_collateral_types" wide
              options={{ RESIDENTIAL: 'Residential', COMMERCIAL: 'Commercial', INDUSTRIAL: 'Industrial', LAND: 'Land' }}
            />
          </div>
        </Section>
      )}

      <Section title="Pricing" sub="Ticket size, tenure and rate band this policy allows.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Min amount (₹)"><input name="min_amount" type="number" placeholder="100000" className={inputClass} /></Field>
          <Field label="Max amount (₹)"><input name="max_amount" type="number" placeholder="3000000" className={inputClass} /></Field>
          <Field label="Min tenure (years)"><input name="min_tenure_years" type="number" step="0.5" placeholder="1" className={inputClass} /></Field>
          <Field label="Max tenure (years)"><input name="max_tenure_years" type="number" step="0.5" placeholder="5" className={inputClass} /></Field>
          <Field label="Base rate (% p.a.)"><input name="base_rate_percent" type="number" step="0.01" placeholder="10.5" className={inputClass} /></Field>
          <Field label="Max risk premium (%)"><input name="max_risk_premium_percent" type="number" step="0.01" placeholder="3" className={inputClass} /></Field>
          <Field label="Processing fee (%)"><input name="processing_fee_percent" type="number" step="0.05" placeholder="1" className={inputClass} /></Field>
        </div>
      </Section>

      <Section title="Decision & documents" sub="Knock-outs, refer reasons and the document set this policy expects.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CheckGroup label="Hard-decline triggers" name="hard_decline_triggers" options={POLICY_HARD_DECLINE_TRIGGERS} />
          <CheckGroup label="Refer triggers" name="refer_triggers" options={POLICY_REFER_TRIGGERS} />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">Required documents</label>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-[#dcdbd6] bg-white px-3 py-2.5">
            {DOC_CATEGORIES.flatMap((cat) => cat.types).map((t) => (
              <label key={t} className="inline-flex items-center gap-1.5 text-[12px] text-[#47453f]">
                <input type="checkbox" name="required_documents" value={t} className="h-3.5 w-3.5 rounded border-[#dcdbd6] accent-[#1a1917]" />
                {DOC_TYPE_LABEL[t]}
              </label>
            ))}
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? 'Creating…' : 'Create draft policy'}
        </button>
        <span className="text-[11px] text-[#7c7a75]">Saved as a draft — activate it from the policy page when it&apos;s ready to go live.</span>
      </div>
      {state?.error && <p className="text-[12px] text-red-600">{state.error}</p>}
    </form>
  )
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] bg-[#efeeeb] p-4">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">{title}</p>
      {sub && <p className="mb-3 text-[11px] text-[#7c7a75]">{sub}</p>}
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

function CheckGroup({
  label, name, options, wide = false,
}: { label: string; name: string; options: Record<string, string>; wide?: boolean }) {
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2 lg:col-span-3' : 'sm:col-span-2'}`}>
      <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">{label}</label>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 rounded-lg border border-[#dcdbd6] bg-white px-3 py-2.5">
        {Object.entries(options).map(([value, optionLabel]) => (
          <label key={value} className="inline-flex items-center gap-1.5 text-[12px] text-[#47453f]">
            <input type="checkbox" name={name} value={value} className="h-3.5 w-3.5 rounded border-[#dcdbd6] accent-[#1a1917]" />
            {optionLabel}
          </label>
        ))}
      </div>
    </div>
  )
}
