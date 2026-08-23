import type { Band } from '@/lib/types'

const BAND_TEXT: Record<Band, string> = {
  STRONG: 'text-[#16694a]', GOOD: 'text-[#1a5d95]', MODERATE: 'text-[#85580d]',
  WEAK: 'text-[#99461a]', CRITICAL: 'text-[#b42318]',
}

/** Inset stat tile — the prototype's `Stat` (`tt`): 20px radius on #efeeeb. */
export function StatTile({
  label, value, sub, band, className = '',
}: { label: string; value: string; sub?: string; band?: Band | null; className?: string }) {
  return (
    <div className={`min-w-0 rounded-[20px] bg-[#efeeeb] px-4 py-3.5 ${className}`}>
      <p className="truncate text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">{label}</p>
      <p className={`mt-1.5 truncate text-[19px] font-bold leading-none tnum ${band ? BAND_TEXT[band] : 'text-[#16161a]'}`} title={value}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] leading-snug text-[#7c7a75]">{sub}</p>}
    </div>
  )
}

/** Label/value row with a hairline rule — the prototype's `KeyValue` (`Nt`). */
export function KeyValueRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-[#e7e6e2] py-2.5 last:border-0">
      <p className="text-[11px] font-medium text-[#7c7a75]">{label}</p>
      <p className={`mt-0.5 text-[13px] font-semibold text-[#16161a] ${mono ? 'tnum' : ''}`}>{value}</p>
    </div>
  )
}

/** Right-aligned figure row — the prototype's `StatLine` (`Zr`). */
export function StatLine({ label, value, band }: { label: string; value: string; band?: Band | null }) {
  return (
    <div className="flex items-center gap-4 border-b border-[#e7e6e2] py-3 last:border-0">
      <span className="min-w-0 flex-1 truncate text-[13px] text-[#5f5d58]">{label}</span>
      <span className={`shrink-0 text-[13px] font-bold tnum ${band ? BAND_TEXT[band] : 'text-[#16161a]'}`}>{value}</span>
    </div>
  )
}
