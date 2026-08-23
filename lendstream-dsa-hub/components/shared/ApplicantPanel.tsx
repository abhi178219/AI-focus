'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { updateLeadSection } from '@/app/actions/leads'
import { fmtAmount } from '@/lib/format'
import type { Lead } from '@/lib/types'

/**
 * Applicant tab — the prototype's read-view with click-to-edit.
 *
 * Each card shows stored values and swaps to inputs when edited, so a user can
 * fill in anything the document parser did not yield. Nothing here is derived
 * or guessed: a field with no stored value reads "—".
 */

type FieldKind = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'

interface FieldDef {
  name: keyof Lead & string
  label: string
  kind?: FieldKind
  options?: { value: string; label: string }[]
  /** Read-only: shown but not editable here (captured at lead creation). */
  readOnly?: boolean
  format?: (lead: Lead) => string | null
  /** Full-width in the grid. */
  wide?: boolean
  help?: string
}

const GENDER = [{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]
const MARITAL = [{ value: 'SINGLE', label: 'Single' }, { value: 'MARRIED', label: 'Married' }, { value: 'OTHER', label: 'Other' }]
const EMPLOYMENT = [{ value: 'SALARIED', label: 'Salaried' }, { value: 'SELF_EMPLOYED', label: 'Self employed' }]
const RESIDENCE = [
  { value: 'OWNED', label: 'Owned' }, { value: 'RENTED', label: 'Rented' },
  { value: 'COMPANY_PROVIDED', label: 'Company provided' }, { value: 'PARENTAL', label: 'Parental' },
  { value: 'LEASED', label: 'Leased' },
]
const CONSTITUTION = [
  { value: 'PROPRIETORSHIP', label: 'Proprietorship' }, { value: 'PARTNERSHIP', label: 'Partnership' },
  { value: 'PRIVATE_LIMITED', label: 'Private limited' }, { value: 'LLP', label: 'LLP' },
  { value: 'PUBLIC_LIMITED', label: 'Public limited' },
]
const PREMISES = [{ value: 'OWNED', label: 'Owned' }, { value: 'RENTED', label: 'Rented' }, { value: 'LEASED', label: 'Leased' }]

function age(dob: string | null): string | null {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a -= 1
  return a >= 0 && a < 120 ? `${a}` : null
}

const SECTIONS: { key: string; title: string; sub: string; fields: FieldDef[] }[] = [
  {
    key: 'applicant', title: 'Applicant', sub: 'Who is asking',
    fields: [
      { name: 'client_name', label: 'Full name', readOnly: true },
      { name: 'date_of_birth', label: 'Date of birth', kind: 'date' },
      { name: 'date_of_birth', label: 'Age', readOnly: true, format: (l) => age(l.date_of_birth) },
      { name: 'gender', label: 'Gender', kind: 'select', options: GENDER },
      { name: 'marital_status', label: 'Marital status', kind: 'select', options: MARITAL },
      { name: 'father_name', label: "Father's name" },
      { name: 'qualification', label: 'Qualification' },
      { name: 'phone', label: 'Mobile', readOnly: true },
      { name: 'email', label: 'Email' },
    ],
  },
  {
    key: 'identity', title: 'Identity & income', sub: 'Drives capacity, FOIR and the Bureau section',
    fields: [
      { name: 'pan_number', label: 'PAN' },
      {
        name: 'aadhaar_last4', label: 'Aadhaar', help: 'Last 4 digits only — the full number is never stored',
        format: (l) => (l.aadhaar_last4 ? `XXXX-XXXX-${l.aadhaar_last4}` : null),
      },
      { name: 'employment_type', label: 'Employment type', kind: 'select', options: EMPLOYMENT },
      { name: 'monthly_income', label: 'Monthly income', kind: 'number', format: (l) => l.monthly_income ? fmtAmount(Number(l.monthly_income)) : null },
      { name: 'existing_emis', label: 'Existing obligations', kind: 'number', format: (l) => l.existing_emis ? `₹${Number(l.existing_emis).toLocaleString('en-IN')}` : null },
      { name: 'cibil_score', label: 'Bureau score', kind: 'number' },
      { name: 'tenure_years', label: 'Tenure (years)', kind: 'number' },
    ],
  },
  {
    key: 'address', title: 'Address', sub: 'Residence stability feeds the credit view',
    fields: [
      { name: 'residence_address', label: 'Current residence', kind: 'textarea', wide: true },
      { name: 'permanent_same_as_current', label: 'Permanent same as current', kind: 'checkbox' },
      { name: 'permanent_address', label: 'Permanent address', kind: 'textarea', wide: true },
      { name: 'residence_city', label: 'City' },
      { name: 'residence_type', label: 'Residence type', kind: 'select', options: RESIDENCE },
      { name: 'years_at_residence', label: 'Years at residence', kind: 'number' },
    ],
  },
  {
    key: 'entity', title: 'Entity', sub: 'Business / company details — scores the Business section',
    fields: [
      { name: 'business_name', label: 'Legal name' },
      { name: 'business_constitution', label: 'Constitution', kind: 'select', options: CONSTITUTION },
      { name: 'incorporation_date', label: 'Incorporated', kind: 'date' },
      { name: 'business_vintage_years', label: 'Vintage (years)', kind: 'number' },
      { name: 'company_pan', label: 'Company PAN' },
      { name: 'gstin', label: 'GSTIN' },
      { name: 'udyam_number', label: 'Udyam' },
      { name: 'cin', label: 'CIN' },
      { name: 'industry', label: 'Industry' },
    ],
  },
  {
    key: 'role', title: 'Role & premises', sub: 'The applicant’s standing in the business',
    fields: [
      { name: 'designation', label: 'Designation' },
      { name: 'din', label: 'DIN / DPIN' },
      { name: 'office_address', label: 'Office address', kind: 'textarea', wide: true },
      { name: 'business_premises_ownership', label: 'Premises', kind: 'select', options: PREMISES },
      { name: 'business_years_at_premises', label: 'Years at premises', kind: 'number' },
    ],
  },
  {
    key: 'coapplicant', title: 'Co-applicant', sub: 'Clubbing income lifts assessed capacity',
    fields: [
      { name: 'has_co_applicant', label: 'Income clubbed', kind: 'checkbox' },
      { name: 'co_applicant_name', label: 'Name' },
      { name: 'co_applicant_relationship', label: 'Relationship' },
      { name: 'co_applicant_dob', label: 'Date of birth', kind: 'date' },
      { name: 'co_applicant_pan', label: 'PAN' },
      { name: 'co_applicant_income', label: 'Monthly income', kind: 'number', format: (l) => l.co_applicant_income ? fmtAmount(Number(l.co_applicant_income)) : null },
    ],
  },
]

export function ApplicantPanel({ leadId, lead }: { leadId: string; lead: Lead }) {
  const [editing, setEditing] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {lead.fields_from_documents?.length > 0 && (
        <p className="px-1 text-[11px] text-[#7c7a75]">
          Auto-filled from documents: {lead.fields_from_documents.join(', ')} — edit any card to correct it.
        </p>
      )}

      {SECTIONS.map((sec) => (
        <SectionCard
          key={sec.key}
          leadId={leadId}
          lead={lead}
          section={sec}
          editing={editing === sec.key}
          onEdit={() => setEditing(sec.key)}
          onDone={() => setEditing(null)}
        />
      ))}
    </div>
  )
}

function SectionCard({
  leadId, lead, section, editing, onEdit, onDone,
}: {
  leadId: string
  lead: Lead
  section: (typeof SECTIONS)[number]
  editing: boolean
  onEdit: () => void
  onDone: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    start(async () => {
      const result = await updateLeadSection(leadId, formData)
      if (result?.error) { setError(result.error); return }
      onDone()
      router.refresh()
    })
  }

  const editable = section.fields.filter((f) => !f.readOnly)

  if (!editing) {
    return (
      <Card>
        <CardHead
          title={section.title}
          sub={section.sub}
          right={
            <button
              type="button" onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#efeeeb] px-3 py-1.5 text-[11.5px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
            >
              <Pencil size={12} /> Edit
            </button>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            {section.fields.map((f, i) => {
              const raw = f.format ? f.format(lead) : displayValue(lead, f)
              const fromDoc = lead.fields_from_documents?.includes(f.name)
              return (
                <div key={`${f.name}-${i}`} className={f.wide ? 'col-span-2 sm:col-span-3 lg:col-span-4' : ''}>
                  <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#7c7a75]">
                    {f.label}
                    {fromDoc && raw && (
                      <span
                        title="Filled from a parsed document — edit to override"
                        className="rounded-full bg-[#eef1fe] px-1.5 py-px text-[8.5px] font-bold tracking-normal text-[#2440e8]"
                      >
                        DOC
                      </span>
                    )}
                  </p>
                  <p className={`text-[12.5px] font-semibold ${raw ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{raw ?? '—'}</p>
                </div>
              )
            })}
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHead title={section.title} sub={section.sub} />
      <CardBody>
        <form action={onSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editable.map((f) => (
              <div key={f.name} className={f.wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <label className="mb-1 block text-[10.5px] font-medium text-[#7c7a75]">{f.label}</label>
                <FieldInput field={f} lead={lead} />
                {f.help && <p className="mt-1 text-[10px] text-[#a8a6a0]">{f.help}</p>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="submit" disabled={pending} className="rounded-full bg-[#1a1917] px-4 py-2 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {pending ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={onDone} disabled={pending} className="rounded-full px-4 py-2 text-[12.5px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]">
              Cancel
            </button>
            {error && <span className="text-[12px] text-red-600">{error}</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

const inputClass = 'w-full rounded-lg border border-[#dcdbd6] bg-white px-3 py-2 text-[13px] focus:border-[#16161a] focus:outline-none'

function FieldInput({ field, lead }: { field: FieldDef; lead: Lead }) {
  const v = lead[field.name] as unknown
  const str = v === null || v === undefined ? '' : String(v)

  if (field.kind === 'checkbox') {
    // The hidden marker tells the action this checkbox was on the submitted
    // card, so an unchecked box saves `false` instead of being ignored.
    return (
      <>
        <input type="hidden" name="__bool" value={field.name} />
        <input type="checkbox" name={field.name} defaultChecked={Boolean(v)} className="mt-1.5 h-4 w-4 accent-[#1a1917]" />
      </>
    )
  }
  if (field.kind === 'select') {
    return (
      <select name={field.name} defaultValue={str} className={inputClass}>
        <option value="">—</option>
        {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    )
  }
  if (field.kind === 'textarea') {
    return <textarea name={field.name} rows={2} defaultValue={str} className={inputClass} />
  }
  return (
    <input
      name={field.name}
      type={field.kind === 'number' ? 'number' : field.kind === 'date' ? 'date' : 'text'}
      step={field.kind === 'number' ? 'any' : undefined}
      maxLength={field.name === 'aadhaar_last4' ? 4 : undefined}
      defaultValue={str}
      className={inputClass}
    />
  )
}

function displayValue(lead: Lead, f: FieldDef): string | null {
  const v = lead[f.name] as unknown
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  const opt = f.options?.find((o) => o.value === v)
  if (opt) return opt.label
  return String(v)
}
