'use client'

import { useMemo, useState } from 'react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { fmtAmount } from '@/lib/format'

interface Slab {
  id: string
  bank_name: string
  product_category: string
  slab_min_amount: number
  slab_max_amount: number | null
  commission_percent: number
}

/** Best configured rate for a category at a given ticket, or null if none applies. */
function bestRate(slabs: Slab[], category: string, amount: number): number | null {
  const matching = slabs.filter(
    (s) => s.product_category === category
      && amount >= s.slab_min_amount
      && (s.slab_max_amount == null || amount <= s.slab_max_amount),
  )
  return matching.length ? Math.max(...matching.map((s) => Number(s.commission_percent))) : null
}

/**
 * Commission & earnings estimator, matching the prototype: a target monthly
 * disbursal volume and a PL/HL product split, projected against the real
 * configured commission slabs. Rates are never assumed — a category with no
 * matching slab contributes nothing and says so.
 */
export function CommissionCalculator({ slabs }: { slabs: Slab[] }) {
  const [volume, setVolume] = useState(5000000)
  const [plShare, setPlShare] = useState(60)

  const plVolume = (volume * plShare) / 100
  const hlVolume = volume - plVolume

  const plRate = useMemo(() => bestRate(slabs, 'PL', plVolume), [slabs, plVolume])
  const hlRate = useMemo(() => bestRate(slabs, 'HL', hlVolume), [slabs, hlVolume])

  const plCommission = plRate != null ? (plVolume * plRate) / 100 : null
  const hlCommission = hlRate != null ? (hlVolume * hlRate) / 100 : null
  const total = (plCommission ?? 0) + (hlCommission ?? 0)
  const anyRate = plRate != null || hlRate != null

  return (
    <Card>
      <CardHead
        title="Commission & earnings estimator"
        sub="Simulate monthly earnings against a target disbursal volume"
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <label className="font-semibold text-[#16161a]">Target monthly disbursal volume</label>
                <span className="font-bold text-[#16161a] tnum">{fmtAmount(volume)}</span>
              </div>
              <input
                type="range" min={1000000} max={25000000} step={500000}
                value={volume} onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#1a1917]"
              />
              <div className="flex justify-between text-[10px] text-[#a8a6a0]">
                <span>₹10 L</span><span>₹1.0 Cr</span><span>₹2.5 Cr</span>
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <label className="font-semibold text-[#16161a]">Product split (PL vs HL)</label>
                <span className="font-bold text-[#16161a] tnum">{plShare}% PL / {100 - plShare}% HL</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={plShare} onChange={(e) => setPlShare(Number(e.target.value))}
                className="w-full accent-[#1a1917]"
              />
              <div className="flex justify-between text-[10px] text-[#a8a6a0]">
                <span>All HL</span><span>All PL</span>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-[#1a1917] p-6 text-white">
            <p className="text-[10px] uppercase tracking-wide text-white/50">Projected monthly DSA commission</p>
            <p className="mt-1 text-[30px] font-bold leading-none tnum">
              {anyRate ? fmtAmount(total) : '—'}
            </p>
            {!anyRate && (
              <p className="mt-2 text-[11.5px] leading-relaxed text-white/60">
                No commission slabs configured for PL or HL at this ticket size — add them below to project earnings.
              </p>
            )}
            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[12px]">
              <Row
                label={plRate != null ? `PL commission (${plRate}%)` : 'PL commission'}
                value={plCommission != null ? fmtAmount(plCommission) : 'No slab'}
                sub={fmtAmount(plVolume)}
              />
              <Row
                label={hlRate != null ? `HL commission (${hlRate}%)` : 'HL commission'}
                value={hlCommission != null ? fmtAmount(hlCommission) : 'No slab'}
                sub={fmtAmount(hlVolume)}
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-white/60">{label}</span>
        <span className="block text-[10.5px] text-white/35 tnum">on {sub}</span>
      </span>
      <span className={`shrink-0 font-semibold tnum ${value === 'No slab' ? 'text-white/40' : 'text-white'}`}>{value}</span>
    </div>
  )
}
