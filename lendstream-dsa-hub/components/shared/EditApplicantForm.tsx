'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { updateLeadDetails } from '@/app/actions/leads'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import type { Lead } from '@/lib/types'

type State = { error?: string; saved?: boolean }

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] focus:border-[#16161a] focus:outline-none'
const labelClass = 'mb-1 block text-[11px] font-medium text-[#7c7a75]'

export function EditApplicantForm({ leadId, lead }: { leadId: string; lead: Lead }) {
  const router = useRouter()

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateLeadDetails(leadId, formData)
    if (result?.error) return { error: result.error }
    router.refresh()
    return { saved: true }
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  const showProperty = lead.loan_type === 'HL' || lead.loan_type === 'LAP' || lead.loan_type === 'BOTH'
  const selfEmployed = lead.employment_type === 'SELF_EMPLOYED'

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHead title="Applicant" sub="Identity and contact — shown across the Overview and CAM" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Email"><input name="email" type="email" defaultValue={lead.email ?? ''} className={inputClass} /></Field>
            <Field label="PAN"><input name="pan_number" defaultValue={lead.pan_number ?? ''} className={inputClass} /></Field>
            <Field label="Date of birth"><input name="date_of_birth" type="date" defaultValue={lead.date_of_birth ?? ''} className={inputClass} /></Field>
            <Field label="Gender">
              <select name="gender" defaultValue={lead.gender ?? ''} className={inputClass}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Marital status">
              <select name="marital_status" defaultValue={lead.marital_status ?? ''} className={inputClass}>
                <option value="">—</option>
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Residence city"><input name="residence_city" defaultValue={lead.residence_city ?? ''} className={inputClass} /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead title="Income & credit" sub="Drives capacity, FOIR and the Bureau section" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Employment type">
              <select name="employment_type" defaultValue={lead.employment_type ?? ''} className={inputClass}>
                <option value="">—</option>
                <option value="SALARIED">Salaried</option>
                <option value="SELF_EMPLOYED">Self employed</option>
              </select>
            </Field>
            <Field label="Monthly income (₹)"><input name="monthly_income" type="number" defaultValue={lead.monthly_income ?? ''} className={inputClass} /></Field>
            <Field label="Existing EMIs (₹/mo)"><input name="existing_emis" type="number" defaultValue={lead.existing_emis} className={inputClass} /></Field>
            <Field label="CIBIL score"><input name="cibil_score" type="number" defaultValue={lead.cibil_score ?? ''} className={inputClass} /></Field>
            <Field label="Tenure (years)"><input name="tenure_years" type="number" defaultValue={lead.tenure_years ?? ''} className={inputClass} /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHead
          title="Business & entity"
          sub={selfEmployed ? 'Scores the Business section' : 'Applies to self-employed files — fill in if the applicant runs a business'}
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Business name"><input name="business_name" defaultValue={lead.business_name ?? ''} className={inputClass} /></Field>
            <Field label="Constitution">
              <select name="business_constitution" defaultValue={lead.business_constitution ?? ''} className={inputClass}>
                <option value="">—</option>
                <option value="PROPRIETORSHIP">Proprietorship</option>
                <option value="PARTNERSHIP">Partnership</option>
                <option value="PRIVATE_LIMITED">Private limited</option>
                <option value="LLP">LLP</option>
                <option value="PUBLIC_LIMITED">Public limited</option>
              </select>
            </Field>
            <Field label="Vintage (years)"><input name="business_vintage_years" type="number" step="0.5" defaultValue={lead.business_vintage_years ?? ''} className={inputClass} /></Field>
            <Field label="Industry"><input name="industry" placeholder="e.g. Trading — General" defaultValue={lead.industry ?? ''} className={inputClass} /></Field>
          </div>
        </CardBody>
      </Card>

      {showProperty && (
        <Card>
          <CardHead title="Property" sub="Scores the Collateral section — a valuation report refines the value" />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Property value (₹)"><input name="property_value" type="number" defaultValue={lead.property_value ?? ''} className={inputClass} /></Field>
              <Field label="Property city"><input name="property_city" defaultValue={lead.property_city ?? ''} className={inputClass} /></Field>
              <Field label="Property stage">
                <select name="property_stage" defaultValue={lead.property_stage ?? ''} className={inputClass}>
                  <option value="">—</option>
                  <option value="READY_TO_MOVE">Ready to move</option>
                  <option value="UNDER_CONSTRUCTION">Under construction</option>
                </select>
              </Field>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHead title="Co-applicant & lender" />
        <CardBody>
          <div className="mb-3 flex items-center gap-2">
            <input id="has_co_applicant" name="has_co_applicant" type="checkbox" defaultChecked={lead.has_co_applicant} className="h-4 w-4" />
            <label htmlFor="has_co_applicant" className="text-[13px] text-[#5f5d58]">Has co-applicant</label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Co-applicant income (₹)"><input name="co_applicant_income" type="number" defaultValue={lead.co_applicant_income ?? ''} className={inputClass} /></Field>
            <Field label="Bank assigned"><input name="bank_assigned" defaultValue={lead.bank_assigned ?? ''} className={inputClass} /></Field>
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-5 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? 'Saving…' : 'Save details'}
        </button>
        {state?.saved && <span className="text-[12px] text-[#16694a]">Saved.</span>}
        {state?.error && <span className="text-[12px] text-red-600">{state.error}</span>}
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}
