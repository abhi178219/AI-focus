import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrintButton } from '@/components/shared/PrintButton'
import type { Lead, DocumentRow, Assessment, AssessmentPillar, LenderOffer, Product } from '@/lib/types'

export async function CamDocument({ leadId, basePath }: { leadId: string; basePath: string }) {
  const supabase = await createClient()
  const { data: lead } = await supabase.from('leads').select('*, profiles!leads_agent_id_fkey(full_name, region)').eq('id', leadId).single<Lead & { profiles: { full_name: string | null; region: string | null } | null }>()
  if (!lead) notFound()

  const [{ data: documents }, { data: assessment }, { data: offers }, { data: product }] = await Promise.all([
    supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>(),
    supabase.from('assessments').select('*, assessment_pillars(*)').eq('lead_id', leadId).order('computed_at', { ascending: false }).limit(1).maybeSingle<Assessment & { assessment_pillars: AssessmentPillar[] }>(),
    supabase.from('lender_offers').select('*').eq('lead_id', leadId).returns<LenderOffer[]>(),
    lead.product_id ? supabase.from('products').select('*').eq('id', lead.product_id).single<Product>() : Promise.resolve({ data: null }),
  ])

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`${basePath}/${leadId}`} className="text-sm text-[#7c7a75] hover:text-[#1a1917]">← Back to lead</Link>
        <PrintButton />
      </div>

      <div className="rounded-[28px] bg-white p-10 shadow-sm print:rounded-none print:p-0 print:shadow-none">
        <div className="mb-8 flex items-center justify-between border-b border-[#efeeeb] pb-4">
          <div>
            <div className="text-lg font-bold text-[#1a1917]">Credit Appraisal Memo</div>
            <div className="text-xs text-[#7c7a75]">LendStream DSA Hub — RupeeBoss Partner Portal</div>
          </div>
          <div className="text-right text-xs text-[#7c7a75]">
            <div>lead-{leadId.slice(0, 6)}</div>
            <div>{new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>

        <Section title="Applicant">
          <Grid>
            <Field label="Name" value={lead.client_name} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Email" value={lead.email} />
            <Field label="PAN" value={lead.pan_number} />
            <Field label="Sourcing partner" value={lead.profiles?.full_name} />
            <Field label="Region" value={lead.profiles?.region} />
          </Grid>
        </Section>

        <Section title="Loan requirement">
          <Grid>
            <Field label="Product" value={product?.name ?? lead.loan_type} />
            <Field label="Requested amount" value={`₹${Number(lead.requested_amount).toLocaleString('en-IN')}`} />
            <Field label="Tenure" value={lead.tenure_years ? `${lead.tenure_years} years` : null} />
            <Field label="Monthly income" value={lead.monthly_income ? `₹${Number(lead.monthly_income).toLocaleString('en-IN')}` : null} />
            <Field label="Existing EMIs" value={`₹${Number(lead.existing_emis).toLocaleString('en-IN')}/mo`} />
            <Field label="CIBIL score" value={lead.cibil_score} />
            {lead.property_value && <Field label="Property value" value={`₹${Number(lead.property_value).toLocaleString('en-IN')}`} />}
            {lead.property_city && <Field label="Property city" value={lead.property_city} />}
          </Grid>
        </Section>

        {lead.case_narrative && (
          <Section title="Case summary">
            <p className="text-sm leading-relaxed text-[#1a1917]">{lead.case_narrative}</p>
          </Section>
        )}

        <Section title="Assessment">
          {assessment ? (
            <>
              <div className="mb-3 flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1a1917]">Verdict: {assessment.verdict}</span>
                <span className="text-sm text-[#5f5d58]">Composite score: {assessment.composite_score.toFixed(0)} ({assessment.composite_band})</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#efeeeb] text-left text-xs uppercase tracking-wide text-[#7c7a75]">
                    <th className="py-1.5">Pillar</th><th className="py-1.5">Score</th><th className="py-1.5">Band</th><th className="py-1.5">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(assessment.assessment_pillars ?? []).map((p) => (
                    <tr key={p.id} className="border-b border-[#f4f3f0] last:border-0">
                      <td className="py-1.5 font-medium text-[#1a1917]">{p.pillar_code}</td>
                      <td className="py-1.5">{p.score.toFixed(0)}</td>
                      <td className="py-1.5">{p.band}</td>
                      <td className="py-1.5 text-[#5f5d58]">{p.headline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assessment.knockouts?.length > 0 && (
                <p className="mt-3 text-sm text-[#b42318]"><strong>Knockouts:</strong> {assessment.knockouts.join(', ')}</p>
              )}
              {assessment.recommendation && <p className="mt-2 text-sm text-[#5f5d58]">{assessment.recommendation}</p>}
            </>
          ) : <p className="text-sm text-[#c9c7c1]">No assessment on file.</p>}
        </Section>

        <Section title="Documents on file">
          {documents && documents.length > 0 ? (
            <ul className="space-y-1 text-sm text-[#1a1917]">
              {documents.map((d) => (
                <li key={d.id}>{d.name} — {d.type.replaceAll('_', ' ')} ({d.status})</li>
              ))}
            </ul>
          ) : <p className="text-sm text-[#c9c7c1]">No documents on file.</p>}
        </Section>

        {offers && offers.length > 0 && (
          <Section title="Lender offers">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#efeeeb] text-left text-xs uppercase tracking-wide text-[#7c7a75]">
                  <th className="py-1.5">Bank</th><th className="py-1.5">Rate</th><th className="py-1.5">Tenure</th><th className="py-1.5">Approved</th><th className="py-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.id} className="border-b border-[#f4f3f0] last:border-0">
                    <td className="py-1.5 font-medium text-[#1a1917]">{o.bank_name}</td>
                    <td className="py-1.5">{o.interest_rate}%</td>
                    <td className="py-1.5">{o.tenure_years}yr</td>
                    <td className="py-1.5">₹{Number(o.approved_amount).toLocaleString('en-IN')}</td>
                    <td className="py-1.5">{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <p className="mt-8 text-[10px] text-[#c9c7c1]">
          Generated {new Date().toLocaleString('en-IN')}. Indicative only — subject to final underwriting, document verification, and lender policy at the time of sanction.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#7c7a75]">{title}</div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-2">{children}</div>
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#7c7a75]">{label}</span>
      <span className="font-medium text-[#1a1917]">{value}</span>
    </div>
  )
}
