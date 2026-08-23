import { BAND_STYLES, BAND_SOLID, BAND_LABEL, type Band } from '@/lib/types'

/** Band chip with its coloured dot — one distinct hue per band, as in the prototype. */
export function BandPill({ band, size = 'sm' }: { band: Band; size?: 'xs' | 'sm' }) {
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${pad} ${BAND_STYLES[band]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${BAND_SOLID[band]}`} />
      {BAND_LABEL[band]}
    </span>
  )
}

/** Horizontal score bar, filled in the band's solid colour. */
export function BandBar({ value, band, className = '' }: { value: number; band: Band; className?: string }) {
  return (
    <div className={`rounded-full bg-[#e3e2de] overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${BAND_SOLID[band]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/** Small neutral tag — the "source" chip on signal rows. */
export function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#efeeeb] text-[#5f5d58] ${className}`}>
      {children}
    </span>
  )
}
