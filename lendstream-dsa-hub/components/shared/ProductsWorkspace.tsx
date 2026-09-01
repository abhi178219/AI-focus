import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/shared/Badge'
import { AddLenderProductForm } from '@/components/shared/AddLenderProductForm'
import { fmtAmount } from '@/lib/format'
import { DOC_TYPE_LABEL } from '@/lib/documentCategories'
import type { Product, LenderProduct } from '@/lib/types'

export async function ProductsWorkspace({ view, basePath }: { view: string; basePath: string }) {
  const supabase = await createClient()

  const [{ data: products }, { data: lenderProducts }] = await Promise.all([
    supabase.from('products').select('*').order('category').returns<Product[]>(),
    supabase.from('lender_products').select('*').order('interest_rate').returns<LenderProduct[]>(),
  ])

  const families = products ?? []
  const options = lenderProducts ?? []
  const activeOptions = options.filter((o) => o.is_active)

  const byFamily = new Map<string, LenderProduct[]>()
  for (const o of activeOptions) {
    byFamily.set(o.product_id, [...(byFamily.get(o.product_id) ?? []), o])
  }

  return (
    <div className="pt-6">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-[#16161a]">Products</h1>
        <p className="text-[13px] text-[#7c7a75]">Policy, pricing and document requirements</p>
      </div>

      <Card>
        <CardHead
          title="Product workspace"
          sub="Keep product policy and lender availability easy to scan in one place."
          right={<Badge className="bg-[#efeeeb] text-[#47453f]">{activeOptions.length} active</Badge>}
        />
        <CardBody>
          <div className="mb-4 flex w-fit gap-1 rounded-full bg-[#efeeeb] p-1">
            <Link href={`${basePath}?view=current`} className={pill(view === 'current')}>Current product information</Link>
            <Link href={`${basePath}?view=all`} className={pill(view === 'all')}>All available products</Link>
          </div>

          {view === 'current' ? (
            <>
              <div className="mb-3">
                <p className="text-[12.5px] font-semibold text-[#16161a]">Product policy</p>
                <p className="text-[11px] text-[#7c7a75]">Rates, fees and mandatory documents</p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {families.filter((p) => p.is_active).map((p) => {
                  const opts = byFamily.get(p.id) ?? []
                  const rates = opts.map((o) => Number(o.interest_rate))
                  const lenders = [...new Set(opts.map((o) => o.lender_name))]
                  return (
                    <div key={p.id} className="rounded-[20px] bg-[#efeeeb] p-5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Current product policy</p>
                      <h3 className="mt-1 text-[15px] font-bold text-[#16161a]">{p.name}</h3>
                      <p className="mt-0.5 text-[11px] text-[#7c7a75]">
                        {opts.length} active lender option{opts.length === 1 ? '' : 's'} available
                      </p>
                      {p.description && <p className="mt-2 text-[11.5px] leading-relaxed text-[#5f5d58]">{p.description}</p>}

                      <dl className="mt-3 space-y-1.5 text-[11.5px]">
                        <Row
                          label="Indicative rates"
                          value={rates.length
                            ? `${Math.min(...rates).toFixed(2)}% – ${Math.max(...rates).toFixed(2)}%`
                            : `${p.min_interest_rate}% – ${p.max_interest_rate}% (policy band)`}
                        />
                        <Row label="Typical tenure" value={`${p.min_tenure_years}–${p.max_tenure_years} years`} />
                        <Row label="Max FOIR" value={`${p.max_foir_percent}%`} />
                        {p.max_ltv_percent && <Row label="Max LTV" value={`${p.max_ltv_percent}%`} />}
                        {p.min_salary_required && <Row label="Min income" value={`₹${p.min_salary_required.toLocaleString('en-IN')}`} />}
                        <Row label="Processing fee" value={`${p.default_processing_fee_percent}%`} />
                        <Row label="Current lenders" value={lenders.length ? lenders.join(' · ') : '—'} />
                      </dl>

                      {p.required_documents?.length > 0 && (
                        <>
                          <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Mandatory documents</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.required_documents.map((d) => (
                              <span key={d} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[#5f5d58]">
                                {d.replaceAll('_', ' ').toLowerCase()}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 rounded-[20px] bg-[#efeeeb] px-4 py-3 text-[11.5px] text-[#7c7a75]">
                <strong className="text-[#16161a]">Product policy view</strong> — use this for the current product families,
                pricing bands and lender coverage. Switch to the catalogue to manage every lender-product combination.
              </div>
            </>
          ) : (
            <>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Lender-product catalogue</p>
                  <p className="text-[12.5px] font-semibold text-[#16161a]">All current products</p>
                  <p className="text-[11px] text-[#7c7a75]">Compare live options available to your team and add new lender products as pricing changes.</p>
                </div>
                <span className="shrink-0 text-[11px] text-[#7c7a75] tnum">{activeOptions.length} active products</span>
              </div>

              {options.length === 0 ? (
                <p className="rounded-[20px] bg-[#efeeeb] p-6 text-center text-[12.5px] text-[#7c7a75]">
                  No lender products configured yet. Add the first one below — calculators and offer ranking will remain empty until then.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-[20px] bg-[#efeeeb]">
                  <table className="w-full min-w-[760px] text-[12.5px]">
                    <thead>
                      <tr className="border-b border-[#dcdbd6] text-left text-[10px] uppercase tracking-wide text-[#7c7a75]">
                        <th className="px-4 py-2.5 font-medium">Product</th>
                        <th className="px-4 py-2.5 font-medium">Lender</th>
                        <th className="px-4 py-2.5 font-medium">Rate</th>
                        <th className="px-4 py-2.5 font-medium">Max sanction</th>
                        <th className="px-4 py-2.5 font-medium">Tenure</th>
                        <th className="px-4 py-2.5 font-medium">Fee</th>
                        <th className="px-4 py-2.5 font-medium">TAT</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {options.map((o) => (
                        <tr key={o.id} className="border-b border-[#e0dfda] last:border-0">
                          <td className="px-4 py-2.5">
                            <span className="mr-2 inline-block rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#47453f]">{o.short_code}</span>
                            <span className="font-semibold text-[#16161a]">{o.display_name}</span>
                            {o.credit_box_note && <p className="mt-0.5 text-[10.5px] text-[#7c7a75]">{o.credit_box_note}</p>}
                            {o.required_documents?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {o.required_documents.map((d) => (
                                  <span key={d} className="rounded-full bg-white px-2 py-0.5 text-[10px] text-[#5f5d58]">
                                    {DOC_TYPE_LABEL[d] ?? d}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-[#5f5d58]">{o.lender_name}</td>
                          <td className="px-4 py-2.5 font-semibold text-[#16161a] tnum">{Number(o.interest_rate).toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-[#5f5d58] tnum">{fmtAmount(Number(o.max_sanction_amount))}</td>
                          <td className="px-4 py-2.5 text-[#5f5d58] tnum">{o.min_tenure_years}–{o.max_tenure_years} yrs</td>
                          <td className="px-4 py-2.5 text-[#5f5d58] tnum">{Number(o.processing_fee_percent).toFixed(2)}%</td>
                          <td className={`px-4 py-2.5 tnum ${o.turnaround_days != null ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>
                            {o.turnaround_days != null ? `${o.turnaround_days}d` : '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <Badge className={o.is_active ? 'bg-[#e8f3ee] text-[#16694a]' : 'bg-[#efeeeb] text-[#7c7a75]'}>
                              {o.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4">
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Catalogue management</p>
                <p className="mb-2 text-[12.5px] font-semibold text-[#16161a]">Add a new product</p>
                <p className="mb-3 text-[11px] text-[#7c7a75]">Create a lender-specific option for the team to use in offers and calculators.</p>
                <AddLenderProductForm products={families} />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function pill(active: boolean) {
  return `rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${active ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#e3e2de]'}`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="shrink-0 text-[#7c7a75]">{label}</span>
      <span className="text-right font-semibold text-[#16161a]">{value}</span>
    </div>
  )
}
