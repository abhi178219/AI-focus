'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/shared/Badge'
import { activatePolicy, deactivatePolicy, duplicatePolicyAsNewVersion } from '@/app/actions/policies'
import { DOC_TYPE_LABEL } from '@/lib/documentCategories'
import {
  COLLATERAL_TYPE_LABEL, EMPLOYMENT_TYPE_LABEL, RESIDENCY_LABEL, THIN_FILE_LABEL,
  effectiveWindow, normalizePolicyParams,
} from '@/lib/policyParams'
import {
  COLLATERAL_PRODUCTS, LOAN_TYPE_LABEL, POLICY_HARD_DECLINE_TRIGGERS,
  POLICY_REFER_TRIGGERS, POLICY_STATUS_LABEL, POLICY_STATUS_STYLES, type Policy,
} from '@/lib/types'

/**
 * One policy version, read-only. A published version is never edited here —
 * an ops admin duplicates it into a new draft instead, so what was live at any
 * point stays exactly as it was.
 */
export function PolicyDetail({ policy, isOps }: { policy: Policy; isOps: boolean }) {
  const params = normalizePolicyParams(policy.params)
  const collateralApplies = COLLATERAL_PRODUCTS.includes(policy.product)

  return (
    <div className="pt-6">
      <Link href="/partner/policy?view=all" className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#7c7a75] hover:text-[#16161a]">
        <ArrowLeft size={13} /> All policy
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">
            {policy.policy_code} · v{policy.version} · {LOAN_TYPE_LABEL[policy.product] ?? policy.product}
          </p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-[#16161a]">{policy.name}</h1>
          <p className="text-[13px] text-[#7c7a75]">{policy.description ?? 'No description'}</p>
        </div>
        <Badge className={POLICY_STATUS_STYLES[policy.status]}>{POLICY_STATUS_LABEL[policy.status]}</Badge>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHead title="Identity & applicability" sub="What this version is, and when it applies." />
          <CardBody>
            <Grid>
              <Field label="Policy code" value={policy.policy_code} />
              <Field label="Version" value={`v${policy.version}`} />
              <Field label="Product" value={LOAN_TYPE_LABEL[policy.product] ?? policy.product} />
              <Field label="Status" value={POLICY_STATUS_LABEL[policy.status]} />
              <Field label="Priority" value={String(policy.priority)} />
              <Field label="Effective" value={effectiveWindow(policy)} />
              <Field label="Change reason" value={policy.change_reason} />
              <Field label="Activated" value={policy.activated_at ? policy.activated_at.slice(0, 10) : null} />
            </Grid>
            {isOps && <PolicyActions policy={policy} />}
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Applicant" sub="Who this policy is written for." />
          <CardBody>
            <Grid>
              <Field label="Minimum age" value={numText(params.applicant.age_min)} />
              <Field label="Maximum age" value={numText(params.applicant.age_max)} />
              <Field label="Min employment vintage" value={unitText(params.applicant.min_employment_vintage_years, ' yrs')} />
              <Field label="Employment types" value={listText(params.applicant.employment_types, EMPLOYMENT_TYPE_LABEL)} />
              <Field label="Residency" value={listText(params.applicant.residency, RESIDENCY_LABEL)} />
            </Grid>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Financial & affordability" sub="Income treatment and obligation limits." />
          <CardBody>
            <Grid>
              <Field label="Min monthly income" value={amountText(params.financial.min_monthly_income)} />
              <Field label="Income averaging" value={unitText(params.financial.income_averaging_months, ' months')} />
              <Field label="Variable income haircut" value={unitText(params.financial.variable_income_haircut_percent, '%')} />
              <Field label="Obligation haircut" value={unitText(params.financial.obligation_haircut_percent, '%')} />
              <Field label="Max FOIR" value={unitText(params.financial.max_foir_percent, '%')} />
              <Field label="Max DTI" value={unitText(params.financial.max_dti_percent, '%')} />
            </Grid>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Bureau & repayment" sub="Score cutoffs and adverse-history treatment." />
          <CardBody>
            <Grid>
              <Field label="Min bureau score" value={numText(params.bureau.min_bureau_score)} />
              <Field label="Thin-file treatment" value={params.bureau.thin_file_treatment ? THIN_FILE_LABEL[params.bureau.thin_file_treatment] : null} />
              <Field label="Max 30+ DPD" value={numText(params.bureau.max_dpd_30_count)} />
              <Field label="Max 90+ DPD" value={numText(params.bureau.max_dpd_90_count)} />
              <Field label="Max enquiries (6m)" value={numText(params.bureau.max_enquiries_last_6m)} />
              <Field label="Write-offs" value={params.bureau.exclude_write_off ? 'Excluded' : 'Not excluded'} />
              <Field label="Settlements" value={params.bureau.exclude_settlement ? 'Excluded' : 'Not excluded'} />
            </Grid>
          </CardBody>
        </Card>

        {collateralApplies && (
          <Card>
            <CardHead title="Collateral" sub={`Security norms for ${LOAN_TYPE_LABEL[policy.product] ?? policy.product}.`} />
            <CardBody>
              <Grid>
                <Field label="Max LTV" value={unitText(params.collateral.max_ltv_percent, '%')} />
                <Field label="Min property value" value={amountText(params.collateral.min_property_value)} />
                <Field label="Max valuation age" value={unitText(params.collateral.valuation_age_max_months, ' months')} />
                <Field label="Accepted types" value={listText(params.collateral.accepted_collateral_types, COLLATERAL_TYPE_LABEL)} />
              </Grid>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHead title="Pricing" sub="Ticket size, tenure and rate band this policy allows." />
          <CardBody>
            <Grid>
              <Field label="Min amount" value={amountText(params.pricing.min_amount)} />
              <Field label="Max amount" value={amountText(params.pricing.max_amount)} />
              <Field label="Min tenure" value={unitText(params.pricing.min_tenure_years, ' yrs')} />
              <Field label="Max tenure" value={unitText(params.pricing.max_tenure_years, ' yrs')} />
              <Field label="Base rate" value={unitText(params.pricing.base_rate_percent, '% p.a.')} />
              <Field label="Max risk premium" value={unitText(params.pricing.max_risk_premium_percent, '%')} />
              <Field label="Processing fee" value={unitText(params.pricing.processing_fee_percent, '%')} />
            </Grid>
          </CardBody>
        </Card>

        <Card>
          <CardHead
            title="Decision & documents"
            sub="Recorded for reference — nothing in this app evaluates these against a file yet."
          />
          <CardBody className="space-y-3">
            <ChipRow label="Hard-decline triggers" values={params.decision.hard_decline_triggers} labels={POLICY_HARD_DECLINE_TRIGGERS} />
            <ChipRow label="Refer triggers" values={params.decision.refer_triggers} labels={POLICY_REFER_TRIGGERS} />
            <ChipRow label="Required documents" values={params.decision.required_documents} labels={DOC_TYPE_LABEL} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function PolicyActions({ policy }: { policy: Policy }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function run(fn: () => Promise<{ error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  const buttonClass = 'rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60'
  const ghostClass = 'rounded-full border border-[#dcdbd6] px-4 py-2 text-[12.5px] font-semibold text-[#47453f] hover:bg-[#efeeeb] disabled:opacity-60'

  return (
    <div className="mt-4 border-t border-[#e7e6e2] pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {policy.status === 'DRAFT' && (
          <button type="button" disabled={pending} onClick={() => run(() => activatePolicy(policy.id))} className={buttonClass}>
            {pending ? 'Working…' : 'Activate'}
          </button>
        )}
        {policy.status === 'ACTIVE' && (
          <button type="button" disabled={pending} onClick={() => run(() => deactivatePolicy(policy.id))} className={buttonClass}>
            {pending ? 'Working…' : 'Deactivate'}
          </button>
        )}
        {policy.status !== 'DRAFT' && (
          <button type="button" disabled={pending} onClick={() => run(() => duplicatePolicyAsNewVersion(policy.id))} className={ghostClass}>
            {pending ? 'Working…' : 'Duplicate as new version'}
          </button>
        )}
      </div>
      <p className="mt-2 text-[11px] text-[#7c7a75]">
        {policy.status === 'DRAFT'
          ? 'Activating retires whichever version of this policy code is live today.'
          : 'Published versions are never edited in place — duplicate to author the next version.'}
      </p>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className={`text-[12.5px] font-semibold ${value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{value ?? '—'}</p>
    </div>
  )
}

function ChipRow({ label, values, labels }: { label: string; values: string[]; labels: Record<string, string> }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{label}</p>
      {values.length === 0 ? (
        <p className="text-[12.5px] font-semibold text-[#c9c7c1]">—</p>
      ) : (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {values.map((v) => (
            <span key={v} className="rounded-full bg-[#efeeeb] px-2 py-0.5 text-[10px] text-[#5f5d58]">{labels[v] ?? v}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function numText(v: number | null): string | null {
  return v == null ? null : String(v)
}

function unitText(v: number | null, unit: string): string | null {
  return v == null ? null : `${v}${unit}`
}

function amountText(v: number | null): string | null {
  return v == null ? null : `₹${Math.round(v).toLocaleString('en-IN')}`
}

function listText<T extends string>(values: T[], labels: Record<T, string>): string | null {
  return values.length ? values.map((v) => labels[v] ?? v).join(' · ') : null
}
