import type { Band } from '@/lib/types'

const BAND_HEX: Record<Band, string> = {
  STRONG: '#1a7f5a', GOOD: '#1f6fb2', MODERATE: '#a06a10', WEAK: '#b8551f', CRITICAL: '#b3323f',
}

/**
 * Composite score ring — stroke coloured by band, score in the middle, caption
 * beneath it. Matches the prototype's `ScoreRing` (its `Lf`), which the
 * Decision tab renders at 92px.
 */
export function BandRing({
  score, band, size = 72, caption,
}: { score: number; band: Band; size?: number; caption?: string }) {
  const value = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${Math.round(value)} out of 100 — ${band.toLowerCase()}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e3e2de" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={BAND_HEX[band]} strokeWidth={stroke} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center leading-none">
          <span className="text-[17px] font-bold text-[#16161a] tnum">{Math.round(value)}</span>
          {caption && (
            <p className="mt-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">{caption}</p>
          )}
        </div>
      </div>
    </div>
  )
}
