import { VERDICT_STYLES, type Verdict } from '@/lib/types'
import { Badge } from './Badge'

export function ScoreRing({ score, verdict }: { score: number; verdict: Verdict }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, score) / 100)

  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#f7f6f4] p-4">
      <div className="relative h-16 w-16">
        <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#e2e0da" strokeWidth="6" />
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#1a1917" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-[#1a1917]">
          {Math.round(score)}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-wide text-[#7c7a75]">Assessment</div>
      <Badge className={VERDICT_STYLES[verdict]}>{verdict}</Badge>
    </div>
  )
}
