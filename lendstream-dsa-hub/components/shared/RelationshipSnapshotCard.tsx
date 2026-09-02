import { Activity } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { StatTile } from '@/components/shared/StatTile'
import { fmtAmount } from '@/lib/format'

/**
 * Everything on this card is computed server-side in the Applicant page from
 * that applicant's own `leads` rows — nothing here is fetched, derived from a
 * model, or estimated. Where a figure genuinely isn't knowable from this app's
 * data (repayment behaviour), the card says so in plain words rather than
 * showing a number.
 */
export interface RelationshipSnapshot {
  /** Sum of disbursed_amount ?? requested_amount across every non-dropped lead. */
  activeExposure: number
  /**
   * `existing_emis` off the single most recent application only — NOT summed
   * across applications. Null when there has never been an application.
   */
  existingEmi: number | null
  /** "2 yr 3 mo" / "5 mo" / "New relationship". Null when there are no leads. */
  tenureLabel: string | null
  /** Stage DISBURSED. */
  wonCount: number
  /** Stage DROPPED. */
  droppedCount: number
  /** Everything else — still moving through the pipeline. */
  activeCount: number
}

export function RelationshipSnapshotCard({ snapshot }: { snapshot: RelationshipSnapshot }) {
  const { activeExposure, existingEmi, tenureLabel, wonCount, droppedCount, activeCount } = snapshot
  const total = wonCount + droppedCount + activeCount

  return (
    <Card>
      <CardHead
        title="Relationship snapshot"
        sub="Across every application this applicant has ever made"
        icon={<Activity size={16} />}
      />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <StatTile
            label="Active exposure"
            value={fmtAmount(activeExposure)}
            sub="Disbursed amount where known, otherwise requested — every application except dropped ones."
          />
          <StatTile
            label="Existing EMI obligation"
            value={existingEmi != null ? fmtAmount(existingEmi) : '—'}
            sub="As declared on the most recent application — not summed across applications, to avoid double-counting the same externally-declared debt."
          />
          <StatTile
            label="Relationship tenure"
            value={tenureLabel ?? '—'}
            sub="From the first application on file to today."
          />
        </div>

        <div className="rounded-[20px] bg-[#efeeeb] px-4 py-3.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">
            Lifetime applications{total > 0 ? ` · ${total}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CountChip label="Won" count={wonCount} className="bg-[#e8f3ee] text-[#16694a]" />
            <CountChip label="Dropped" count={droppedCount} className="bg-[#fbebeb] text-[#b42318]" />
            <CountChip label="Active" count={activeCount} className="bg-[#eef1fe] text-[#2440e8]" />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-[#7c7a75]">
            This app doesn&apos;t track a separate &lsquo;lost&rsquo; stage — anything not disbursed or dropped is
            still active in the pipeline.
          </p>
        </div>

        {/* One honest line among the stats, not a fabricated number and not a
            full empty-state block — servicing data simply isn't in this app. */}
        <p className="text-[11.5px] leading-relaxed text-[#7c7a75]">
          <span className="font-semibold text-[#5f5d58]">Repayment behaviour:</span>{' '}
          Not available — this app captures loan origination, not loan servicing, so on-time / DPD history
          isn&apos;t tracked here yet.
        </p>
      </CardBody>
    </Card>
  )
}

function CountChip({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 ${className}`}>
      <span className="text-[15px] font-bold leading-none tnum">{count}</span>
      <span className="text-[11px] font-semibold">{label}</span>
    </span>
  )
}
