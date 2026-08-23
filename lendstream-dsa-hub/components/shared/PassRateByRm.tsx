import Link from 'next/link'
import { MoreHorizontal } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { Avatar } from '@/components/shared/Avatar'

export interface RmPassRate {
  id: string
  name: string
  /** 0–100, computed from assessed leads only. */
  rate: number
  assessed: number
}

/**
 * "Pass Rate by RM" — the prototype's leaderboard panel: avatar, name, bar,
 * percentage, an "N files assessed" footer and a "View all leads" button.
 *
 * `scopeNote` exists because RLS scopes a partner to their own leads: on the
 * partner surface this can only ever show the signed-in partner, and the panel
 * says so rather than implying a team breakdown that isn't there.
 */
export function PassRateByRm({
  rows, filesAssessed, viewAllHref, scopeNote,
}: {
  rows: RmPassRate[]
  filesAssessed: number
  viewAllHref: string
  scopeNote?: string
}) {
  return (
    <Card>
      <CardHead title="Pass Rate by RM" sub={scopeNote} right={<MoreHorizontal size={16} className="text-[#a8a6a0]" />} />
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-[13px] text-[#a8a6a0]">No assessed leads yet.</p>
        ) : (
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <Avatar name={r.name} size={34} />
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#47453f]">{r.name}</p>
                <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[#e3e2de]">
                  <div className="h-full rounded-full bg-[#2440e8]" style={{ width: `${Math.max(2, Math.min(100, r.rate))}%` }} />
                </div>
                <span className="w-11 shrink-0 text-right text-[13px] font-bold text-[#16161a] tnum">{r.rate.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#e7e6e2] pt-4">
          <p className="text-[12px] text-[#5f5d58]">
            <strong className="font-bold text-[#16161a] tnum">{filesAssessed}</strong> files assessed
          </p>
        </div>

        <Link
          href={viewAllHref}
          className="mt-4 grid h-10 w-full place-items-center rounded-full bg-[#1a1917] text-[13px] font-semibold text-white hover:opacity-90"
        >
          View all leads
        </Link>
      </CardBody>
    </Card>
  )
}
