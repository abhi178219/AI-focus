/**
 * Pillar radar — the chart the prototype renders to the right of the Portfolio
 * Overview stats. Needs at least three axes to have any shape; the caller
 * renders "Not enough assessed files to plot." below that threshold.
 *
 * Every axis value here must come from real assessment_pillars rows — this
 * component never invents a point.
 */
export interface RadarAxis {
  label: string
  /** 0–100. */
  value: number
}

export function PillarRadar({ axes, size = 260, className = '' }: { axes: RadarAxis[]; size?: number; className?: string }) {
  if (axes.length < 3) return null

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.32
  const point = (i: number, radius: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]
  }
  const outline = axes.map((_, i) => point(i, r).join(',')).join(' ')
  const shape = axes
    .map((a, i) => point(i, r * Math.max(0.12, Math.min(1, a.value / 100))).join(','))
    .join(' ')

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        role="img"
        aria-label={axes.map((a) => `${a.label} ${Math.round(a.value)}`).join(', ')}
      >
        <defs>
          <radialGradient id="pillar-radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2440e8" stopOpacity="0.62" />
            <stop offset="45%" stopColor="#3d55ec" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#8fa2f7" stopOpacity="0.04" />
          </radialGradient>
        </defs>
        {[1, 0.66, 0.33].map((ring) => (
          <polygon
            key={ring}
            points={axes.map((_, i) => point(i, r * ring).join(',')).join(' ')}
            fill="none" stroke="#dcdbd6" strokeWidth="1"
          />
        ))}
        {axes.map((a, i) => {
          const [x, y] = point(i, r * 1.13)
          return <line key={a.label} x1={cx} y1={cy} x2={x} y2={y} stroke="#c9c7c1" strokeWidth="1" />
        })}
        <polygon points={outline} fill="none" stroke="#dcdbd6" strokeWidth="1" />
        <polygon points={shape} fill="url(#pillar-radar-fill)" stroke="#2440e8" strokeWidth="2.5" strokeLinejoin="round" />
        {axes.map((a, i) => {
          const [x, y] = point(i, r * Math.max(0.12, Math.min(1, a.value / 100)))
          return <circle key={a.label} cx={x} cy={y} r="3" fill="#2440e8" />
        })}
      </svg>
      {axes.map((a, i) => {
        const [x, y] = point(i, r * 1.38)
        return (
          <span
            key={a.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[12px] font-medium text-[#5f5d58]"
            style={{ left: x, top: y }}
          >
            {a.label}
          </span>
        )
      })}
    </div>
  )
}
