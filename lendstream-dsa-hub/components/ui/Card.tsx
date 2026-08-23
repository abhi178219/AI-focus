import type { ReactNode } from 'react'

/** Card shell — surface #f7f6f4, 28px radius, soft elevation. Matches the prototype's `Card`. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-[#f7f6f4] rounded-[28px] elev overflow-hidden ${className}`}>{children}</section>
}

/** Card header — title, optional sub-line, optional leading icon and right slot. */
export function CardHead({
  title, sub, icon, right,
}: { title: string; sub?: string; icon?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <span className="grid place-items-center w-9 h-9 rounded-xl bg-[#efeeeb] shrink-0 text-[#5f5d58]">{icon}</span>}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#16161a] leading-tight">{title}</p>
          {sub && <p className="text-[11px] text-[#7c7a75] mt-0.5 leading-snug">{sub}</p>}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 pb-4 ${className}`}>{children}</div>
}
