import { MoreHorizontal } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'

export interface LenderSanctionRate {
  bank: string
  /** 0–100. Sanctioned or Disbursed, out of every file assigned to this bank. */
  rate: number
  total: number
  sanctioned: number
}

/**
 * "Sanction Rate by Lender" — same leaderboard shape as Pass Rate by RM: bank
 * name, a bar, the percentage, and a footer with the file count it's based
 * on. Scoped to files that have a `bank_assigned` at all — a lead nobody has
 * assigned to a bank yet says nothing about that bank.
 */
export function SanctionRateByLender({ rows }: { rows: LenderSanctionRate[] }) {
  const totalAssigned = rows.reduce((s, r) => s + r.total, 0)

  return (
    <Card className="lg:col-span-3">
      <CardHead
        title="Sanction Rate by Lender"
        sub="Share of files assigned to each bank that reached Sanctioned or Disbursed"
        right={<MoreHorizontal size={16} className="text-[#a8a6a0]" />}
      />
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-[13px] text-[#a8a6a0]">No files have a bank assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {rows.map((r) => (
              <div key={r.bank} className="flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#47453f]">{r.bank}</p>
                <div className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-[#e3e2de]">
                  <div className="h-full rounded-full bg-[#2440e8]" style={{ width: `${Math.max(2, Math.min(100, r.rate))}%` }} />
                </div>
                <span className="w-11 shrink-0 text-right text-[13px] font-bold text-[#16161a] tnum">{r.rate.toFixed(0)}%</span>
                <span className="w-16 shrink-0 text-right text-[10.5px] text-[#7c7a75] tnum">{r.sanctioned}/{r.total}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-[#e7e6e2] pt-4">
          <p className="text-[12px] text-[#5f5d58]">
            <strong className="font-bold text-[#16161a] tnum">{totalAssigned}</strong> file{totalAssigned === 1 ? '' : 's'} with a bank assigned
          </p>
        </div>
      </CardBody>
    </Card>
  )
}
