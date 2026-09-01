import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/shared/Badge'
import { CreatePolicyForm } from '@/components/shared/CreatePolicyForm'
import { effectiveWindow, normalizePolicyParams, policySummaryLine } from '@/lib/policyParams'
import {
  LOAN_TYPE_LABEL, POLICY_PRODUCTS, POLICY_STATUS_LABEL, POLICY_STATUS_STYLES,
  type Policy, type PolicyProduct,
} from '@/lib/types'

/**
 * The Policy tab. Three sub-views on one component, same shape as
 * ProductsWorkspace: Live policy (active versions grouped by product), All
 * policy (every version, every status) and Create policy (ops-admin only).
 *
 * Browsing and authoring only — nothing here evaluates a policy against a
 * file. See the Policy comment in lib/types.ts for the scope cut.
 */
export async function PolicyWorkspace({ view, basePath }: { view: string; basePath: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: policyRows } = await supabase.from('policies').select('*')
    .order('policy_code').order('version', { ascending: false })
    .returns<Policy[]>()

  const policies = policyRows ?? []
  const active = policies.filter((p) => p.status === 'ACTIVE')

  const byProduct = new Map<PolicyProduct, Policy[]>()
  for (const p of active) {
    byProduct.set(p.product, [...(byProduct.get(p.product) ?? []), p])
  }

  return (
    <div className="pt-6">
      <div className="mb-5">
        <h1 className="text-[28px] font-bold text-[#16161a]">Policy</h1>
        <p className="text-[13px] text-[#7c7a75]">Credit policy configuration by product</p>
      </div>

      <Card>
        <CardHead
          title="Policy workspace"
          sub="Live credit boxes, their full version history, and where new ones are authored."
          right={<Badge className="bg-[#efeeeb] text-[#47453f]">{active.length} live</Badge>}
        />
        <CardBody>
          <div className="mb-4 flex w-fit gap-1 rounded-full bg-[#efeeeb] p-1">
            <Link href={`${basePath}?view=live`} className={pill(view === 'live')}>Live policy</Link>
            <Link href={`${basePath}?view=all`} className={pill(view === 'all')}>All policy</Link>
            <Link href={`${basePath}?view=create`} className={pill(view === 'create')}>Create policy</Link>
          </div>

          {view === 'all' ? (
            <AllPolicyView policies={policies} basePath={basePath} />
          ) : view === 'create' ? (
            <CreateView />
          ) : (
            <LivePolicyView byProduct={byProduct} activeCount={active.length} basePath={basePath} />
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function LivePolicyView({
  byProduct, activeCount, basePath,
}: { byProduct: Map<PolicyProduct, Policy[]>; activeCount: number; basePath: string }) {
  return (
    <>
      <div className="mb-3">
        <p className="text-[12.5px] font-semibold text-[#16161a]">Live policy</p>
        <p className="text-[11px] text-[#7c7a75]">The active version for each product. Open a policy to see every parameter configured against it.</p>
      </div>

      {activeCount === 0 ? (
        <p className="rounded-[20px] bg-[#efeeeb] p-6 text-center text-[12.5px] text-[#7c7a75]">
          No policy is live yet. Drafts stay off this view until they&apos;re activated —{' '}
          <Link href={`${basePath}?view=all`} className="font-semibold text-[#2440e8] hover:underline">see all policy</Link>.
        </p>
      ) : (
        <div className="space-y-4">
          {POLICY_PRODUCTS.filter((product) => byProduct.has(product)).map((product) => {
            const items = byProduct.get(product) ?? []
            return (
              <div key={product}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">{LOAN_TYPE_LABEL[product] ?? product}</p>
                  <span className="shrink-0 text-[11px] text-[#7c7a75] tnum">
                    {items.length} live polic{items.length === 1 ? 'y' : 'ies'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((p) => <LivePolicyCard key={p.id} policy={p} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function LivePolicyCard({ policy }: { policy: Policy }) {
  const params = normalizePolicyParams(policy.params)
  const summary = policySummaryLine(params)
  const effective = effectiveWindow(policy)

  return (
    <Link href={`/partner/policy/${policy.id}`} className="block rounded-[20px] bg-[#efeeeb] p-5 hover:bg-[#e7e6e2]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">{policy.policy_code} · v{policy.version}</p>
          <h3 className="mt-1 text-[15px] font-bold leading-snug text-[#16161a]">{policy.name}</h3>
        </div>
        <Badge className={POLICY_STATUS_STYLES[policy.status]}>{POLICY_STATUS_LABEL[policy.status]}</Badge>
      </div>

      {policy.description && <p className="mt-2 text-[11.5px] leading-relaxed text-[#5f5d58]">{policy.description}</p>}

      <dl className="mt-3 space-y-1.5 text-[11.5px]">
        <Row label="Priority" value={String(policy.priority)} />
        <Row label="Effective" value={effective ?? '—'} />
        <Row label="Key limits" value={summary ?? '—'} />
      </dl>
    </Link>
  )
}

function AllPolicyView({ policies, basePath }: { policies: Policy[]; basePath: string }) {
  return (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Policy repository</p>
          <p className="text-[12.5px] font-semibold text-[#16161a]">All policy</p>
          <p className="text-[11px] text-[#7c7a75]">Every version ever authored — draft, live and retired.</p>
        </div>
        <span className="shrink-0 text-[11px] text-[#7c7a75] tnum">{policies.length} version{policies.length === 1 ? '' : 's'}</span>
      </div>

      {policies.length === 0 ? (
        <p className="rounded-[20px] bg-[#efeeeb] p-6 text-center text-[12.5px] text-[#7c7a75]">
          No policies configured yet —{' '}
          <Link href={`${basePath}?view=create`} className="font-semibold text-[#2440e8] hover:underline">create the first one</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[20px] bg-[#efeeeb]">
          <table className="w-full min-w-[880px] text-[12.5px]">
            <thead>
              <tr className="border-b border-[#dcdbd6] text-left text-[10px] uppercase tracking-wide text-[#7c7a75]">
                <th className="px-4 py-2.5 font-medium">Policy code</th>
                <th className="px-4 py-2.5 font-medium">Version</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Product</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Effective</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.id} className="border-b border-[#e0dfda] last:border-0 hover:bg-[#e7e6e2]">
                  <td className="px-4 py-2.5">
                    <Link href={`/partner/policy/${p.id}`} className="inline-block rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#47453f]">
                      {p.policy_code}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-[#5f5d58] tnum">v{p.version}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/partner/policy/${p.id}`} className="font-semibold text-[#16161a] hover:underline">{p.name}</Link>
                    {p.change_reason && <p className="mt-0.5 text-[10.5px] text-[#7c7a75]">{p.change_reason}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-[#5f5d58]">{LOAN_TYPE_LABEL[p.product] ?? p.product}</td>
                  <td className="px-4 py-2.5">
                    <Badge className={POLICY_STATUS_STYLES[p.status]}>{POLICY_STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[#5f5d58] tnum">{p.priority}</td>
                  <td className={`px-4 py-2.5 tnum ${effectiveWindow(p) ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>
                    {effectiveWindow(p) ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-[#5f5d58] tnum">{p.updated_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function CreateView() {
  return (
    <>
      <div className="mb-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-[#7c7a75]">Policy authoring</p>
        <p className="text-[12.5px] font-semibold text-[#16161a]">Create policy</p>
        <p className="text-[11px] text-[#7c7a75]">
          Configure the parameters, save as a draft, then activate it when it&apos;s ready. Reuse an existing policy code to author its next version.
          Anyone can author a draft — activating, pausing or duplicating a published version is Ops-Admin only.
        </p>
      </div>

      <CreatePolicyForm />
    </>
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
