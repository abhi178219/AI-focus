import Link from 'next/link'
import { Upload } from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { BandPill, BandBar } from '@/components/ui/BandPill'
import { BAND_SOLID, BAND_STYLES, type Band } from '@/lib/types'
import type {
  SectionView, SectionHero, SectionMeter, SectionTrend, SectionRankedList,
  SectionBreakdown, SectionRatioGrid, SectionSignalGroup, SectionBandPanel,
} from '@/lib/decision/sections'

/**
 * Full-page view of one analytical section (Banking, GST, Bureau, …).
 *
 * Renders whatever the parsed document actually yielded, in the prototype's
 * order: gauge → trend → hero tiles → tables → signals → ranked lists →
 * breakdowns → ratios → panels → prose → capacity → policy. Anything the
 * document did not contain shows as "—"; if the document itself is absent we
 * say so and link to upload it rather than rendering placeholder numbers.
 */
export function SectionPanel({ section, basePath, leadId }: { section: SectionView; basePath: string; leadId: string }) {
  const hasHero = !!section.hero?.length
  const hero: SectionHero[] = section.hero ?? section.metrics.map((m) => ({ label: m.label, value: m.value }))

  return (
    <div className="space-y-4">
      {/* The section still renders its full shape when the source is absent —
          every figure reads "—" and this banner says what to go and get. */}
      {section.status === 'missing' && <SourcePrompt section={section} basePath={basePath} leadId={leadId} />}

      {section.meter && <Meter meter={section.meter} />}
      {section.trend && <Trend trend={section.trend} />}

      {(hasHero || !section.meter) && (
        <Card>
          <CardHead
            title={section.label}
            sub={section.headline}
            right={section.band ? <BandPill band={section.band} /> : undefined}
          />
          <CardBody>
            <HeroRow items={hero} />
          </CardBody>
        </Card>
      )}

      {section.tables?.map((t) => (
        <Card key={t.title}>
          <CardHead title={t.title} sub={t.sub} />
          <CardBody>
            <div className="overflow-x-auto rounded-[20px] bg-[#efeeeb]">
              <table className="w-full min-w-[620px] text-[12.5px]">
                <thead>
                  <tr className="border-b border-[#dcdbd6] text-left text-[10px] uppercase tracking-wide text-[#7c7a75]">
                    {t.columns.map((c) => <th key={c} className="px-4 py-2.5 font-medium">{c}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {t.rows.length === 0 && (
                    <tr>
                      <td colSpan={t.columns.length} className="px-4 py-6 text-center text-[12px] text-[#a8a6a0]">
                        {t.emptyText ?? 'Not itemised in the parsed document.'}
                      </td>
                    </tr>
                  )}
                  {t.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-[#e0dfda] last:border-0 ${t.emphasise?.includes(i) ? 'bg-[#e3e2de]/60 font-semibold' : ''}`}>
                      {row.map((cell, j) => (
                        <td key={j} className={`px-4 py-2 tnum ${j === 0 ? 'font-semibold text-[#16161a]' : cell ? 'text-[#5f5d58]' : 'text-[#c9c7c1]'}`}>
                          {cell ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ))}

      {section.signals && <Signals group={section.signals} score={section.band} />}

      {section.subHero && section.subHero.length > 0 && (
        <Card><CardBody className="pt-4"><HeroRow items={section.subHero} /></CardBody></Card>
      )}

      {section.ranked?.map((r) => <Ranked key={r.title} list={r} />)}
      {section.breakdowns?.map((b) => <Breakdown key={b.title} data={b} />)}
      {section.ratios && <Ratios grid={section.ratios} />}

      {(section.panels?.length || section.bandPanels?.length || section.conduct) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {section.panels?.map((p) => (
            <Card key={p.title}>
              <CardHead title={p.title} sub={p.sub} />
              <CardBody className="space-y-1.5">
                {p.items.map((it) => (
                  <div key={it.label} className="flex items-baseline justify-between gap-3 border-b border-[#e7e6e2] py-1.5 last:border-0">
                    <span className="shrink-0 text-[11.5px] text-[#7c7a75]">{it.label}</span>
                    <span className={`text-right text-[12px] font-semibold tnum ${it.value ? (it.emphasis ? 'text-[#16694a]' : 'text-[#16161a]') : 'text-[#c9c7c1]'}`}>
                      {it.value ?? '—'}
                    </span>
                  </div>
                ))}
              </CardBody>
            </Card>
          ))}

          {section.bandPanels?.map((bp) => <BandPanel key={bp.title} panel={bp} />)}

          {section.conduct && (
            <Card>
              <CardHead title={section.conduct.title} right={<BandPill band={section.conduct.band} size="xs" />} />
              <CardBody><p className="text-[12.5px] leading-relaxed text-[#47453f]">{section.conduct.text}</p></CardBody>
            </Card>
          )}
        </div>
      )}

      {section.prose?.map((p) => (
        <Card key={p.title}>
          <CardHead title={p.title} sub={p.sub} right={p.badge ? <span className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#47453f]">{p.badge}</span> : undefined} />
          <CardBody><p className="text-[12.5px] leading-relaxed text-[#47453f]">{p.text}</p></CardBody>
        </Card>
      ))}

      {(section.capacity || section.knockouts?.length || section.chips || section.notes) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {section.capacity && (
            <Card>
              <CardHead title="Implied capacity" />
              <CardBody>
                <p className="text-[24px] font-bold text-[#16161a] tnum leading-none">{section.capacity.value ?? '—'}</p>
                {section.capacity.basis && <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#7c7a75]">{section.capacity.basis}</p>}
              </CardBody>
            </Card>
          )}

          {(section.knockouts?.length || section.chips) && (
            <Card>
              <CardHead title={section.chips?.title ?? 'Policy'} />
              <CardBody>
                {section.knockouts?.length ? (
                  <ul className="space-y-2">
                    {section.knockouts.map((k) => (
                      <li key={k.code} className="rounded-[16px] bg-[#fbebeb] px-3.5 py-2.5">
                        <p className="text-[12px] font-semibold text-[#b42318]">{k.label}</p>
                        <p className="text-[11px] text-[#b42318]/80">{k.detail}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`inline-flex rounded-full px-3 py-1.5 text-[12px] font-semibold ${BAND_STYLES[section.chips!.band]}`}>
                    Clears policy — no knockouts.
                  </p>
                )}
                {section.chips?.items?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {section.chips.items.map((c) => (
                      <span key={c} className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] text-[#5f5d58]">{c}</span>
                    ))}
                  </div>
                ) : null}
              </CardBody>
            </Card>
          )}

          {section.notes && (
            <Card>
              <CardHead title={section.notes.title} sub={section.notes.sub} />
              <CardBody>
                <ul className="space-y-1.5">
                  {section.notes.items.map((n, i) => (
                    <li key={i} className="text-[12px] leading-relaxed text-[#5f5d58]">• {n}</li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <p className="px-1 text-[11px] text-[#7c7a75]">
        Derived from the parsed {section.sourceLabel.toLowerCase()} on this file. Values shown as “—” were not present in the document.
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- fragments */

function HeroRow({ items }: { items: SectionHero[] }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${items.length >= 5 ? 'sm:grid-cols-3 xl:grid-cols-5' : 'sm:grid-cols-4'}`}>
      {items.map((h) => (
        <div key={h.label} className="rounded-[20px] bg-[#efeeeb] p-4">
          <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{h.label}</p>
          <p className={`mt-0.5 text-[19px] font-bold leading-tight tnum ${
            h.value ? (h.band ? bandText(h.band) : 'text-[#16161a]') : 'text-[#c9c7c1]'
          }`}>
            {h.value ?? '—'}
          </p>
          {h.sub && <p className="mt-0.5 text-[10.5px] text-[#7c7a75]">{h.sub}</p>}
        </div>
      ))}
    </div>
  )
}

function bandText(b: Band) {
  return BAND_STYLES[b].split(' ').find((c) => c.startsWith('text-')) ?? 'text-[#16161a]'
}

function Signals({ group, score }: { group: SectionSignalGroup; score: Band | null }) {
  return (
    <Card>
      <CardHead title={group.title} sub={group.sub} right={score ? <BandPill band={score} size="xs" /> : undefined} />
      <CardBody className="py-1">
        {group.rows.length === 0 && (
          <p className="py-3 text-[12px] text-[#a8a6a0]">No signals yet — these come from the parsed document.</p>
        )}
        {group.rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-[#dcdbd6]/70 py-2.5 last:border-0">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.band ? BAND_SOLID[r.band] : 'bg-[#c9c7c1]'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-[#16161a]">{r.label}</p>
              {r.note && <p className="mt-0.5 text-[11px] leading-relaxed text-[#7c7a75]">{r.note}</p>}
            </div>
            <span className={`shrink-0 text-right text-[12px] font-semibold tnum ${r.value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>
              {r.value ?? '—'}
            </span>
            {r.band && <span className="shrink-0"><BandPill band={r.band} size="xs" /></span>}
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

function Meter({ meter }: { meter: SectionMeter }) {
  const fill = clamp(meter.fillPercent)
  const overlay = clamp(meter.overlayPercent)
  const cap = clamp(meter.capPercent)
  return (
    <Card>
      <CardHead
        title={meter.title}
        sub={meter.sub}
        right={meter.headline
          ? <div className="text-right">
              <p className={`text-[19px] font-bold tnum leading-none ${meter.band ? bandText(meter.band) : 'text-[#16161a]'}`}>{meter.headline.value ?? '—'}</p>
              <p className="text-[10.5px] text-[#7c7a75]">{meter.headline.label}</p>
            </div>
          : undefined}
      />
      <CardBody>
        <div className="relative h-3 rounded-full bg-[#e3e2de]">
          {overlay !== null && <div className="absolute inset-y-0 left-0 rounded-full bg-[#a8a6a0]" style={{ width: `${overlay}%` }} />}
          {fill !== null && (
            <div className={`absolute inset-y-0 left-0 rounded-full ${meter.band ? BAND_SOLID[meter.band] : 'bg-[#1a1917]'}`} style={{ width: `${fill}%` }} />
          )}
          {cap !== null && (
            <div className="absolute inset-y-[-3px] w-[2px] bg-[#16161a]" style={{ left: `${cap}%` }} title={meter.capLabel ?? 'Policy cap'} />
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-[#7c7a75]">
          <span>{meter.fillLabel ?? ''}</span>
          <span>{meter.capLabel ?? ''}</span>
        </div>

        {meter.legend?.length ? (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-[#7c7a75]">
            {meter.legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  l.kind === 'fill' ? (meter.band ? BAND_SOLID[meter.band] : 'bg-[#1a1917]')
                  : l.kind === 'overlay' ? 'bg-[#a8a6a0]' : 'bg-[#16161a]'
                }`} />
                {l.label}
              </span>
            ))}
          </div>
        ) : null}

        {meter.tiles?.length ? <div className="mt-4"><HeroRow items={meter.tiles} /></div> : null}

        {meter.alert && (
          <p className={`mt-3 rounded-[16px] px-3.5 py-2.5 text-[12px] leading-relaxed ${BAND_STYLES[meter.alert.band]}`}>
            {meter.alert.text}
          </p>
        )}
        {meter.note && <p className="mt-2 text-[11.5px] leading-relaxed text-[#7c7a75]">{meter.note}</p>}
      </CardBody>
    </Card>
  )
}

function Trend({ trend }: { trend: SectionTrend }) {
  const max = Math.max(...trend.points.map((p) => p.value ?? 0), 1)
  return (
    <Card>
      <CardHead
        title={trend.title}
        sub={trend.sub}
        right={trend.right ? <BandPillText text={trend.right.text} band={trend.right.band} /> : undefined}
      />
      <CardBody>
        <div className="flex items-end gap-1.5">
          {trend.points.map((p, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5" title={p.display ?? undefined}>
              <div className="flex h-24 w-full items-end">
                <div className="w-full rounded-t-md bg-[#1a1917]/80" style={{ height: Math.max(3, ((p.value ?? 0) / max) * 96) }} />
              </div>
              <span className="text-[9.5px] text-[#7c7a75]">{p.label}</span>
            </div>
          ))}
        </div>
        {trend.axis?.length ? (
          <div className="mt-1 flex justify-between text-[10px] text-[#a8a6a0]">
            {trend.axis.map((a) => <span key={a}>{a}</span>)}
          </div>
        ) : null}
        {trend.points.every((p) => p.value === null) && (
          <p className="mt-2 text-[11px] text-[#a8a6a0]">No period data in the parsed document.</p>
        )}
        {trend.tiles?.length ? <div className="mt-4"><HeroRow items={trend.tiles} /></div> : null}
      </CardBody>
    </Card>
  )
}

function BandPillText({ text, band }: { text: string; band: Band }) {
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${BAND_STYLES[band]}`}>{text}</span>
}

function Ranked({ list }: { list: SectionRankedList }) {
  return (
    <Card>
      <CardHead title={list.title} sub={list.sub} />
      <CardBody className="py-1">
        {list.rows.length === 0 && <p className="py-3 text-[12px] text-[#a8a6a0]">Not itemised in the parsed document.</p>}
        {list.rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[#dcdbd6]/70 py-2.5 last:border-0">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#efeeeb] text-[10.5px] font-bold text-[#47453f] tnum">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-medium text-[#16161a]">{r.name}</p>
              {r.sub && <p className="truncate text-[11px] text-[#7c7a75]">{r.sub}</p>}
              {r.sharePercent !== null && (
                <div className="mt-1 h-1 w-full max-w-[220px] rounded-full bg-[#e3e2de]">
                  <div className={`h-1 rounded-full ${r.band ? BAND_SOLID[r.band] : 'bg-[#1a1917]'}`} style={{ width: `${clamp(r.sharePercent)}%` }} />
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[12.5px] font-semibold text-[#16161a] tnum">{r.value ?? '—'}</p>
              {r.sharePercent !== null && <p className="text-[10.5px] text-[#7c7a75] tnum">{r.sharePercent.toFixed(1)}%</p>}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

function Breakdown({ data }: { data: SectionBreakdown }) {
  return (
    <Card>
      <CardHead title={data.title} sub={data.sub} />
      <CardBody className="py-1">
        {data.rows.length === 0 && (
          <p className="py-3 text-[12px] text-[#a8a6a0]">Not itemised in the parsed document.</p>
        )}
        {data.rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-[#dcdbd6]/70 py-2.5 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-[#16161a]">{r.label}</p>
              {r.sub && <p className="text-[11px] text-[#7c7a75]">{r.sub}</p>}
              {r.sharePercent !== null && (
                <div className="mt-1 h-1 w-full max-w-[260px] rounded-full bg-[#e3e2de]">
                  <div className="h-1 rounded-full bg-[#1a1917]" style={{ width: `${clamp(r.sharePercent)}%` }} />
                </div>
              )}
            </div>
            <span className="shrink-0 text-[12.5px] font-semibold text-[#16161a] tnum">{r.value ?? '—'}</span>
          </div>
        ))}
        {data.total && (
          <div className="flex items-center justify-between border-t border-[#dcdbd6] pt-2.5 text-[12.5px] font-bold text-[#16161a]">
            <span>{data.total.label}</span><span className="tnum">{data.total.value ?? '—'}</span>
          </div>
        )}
      </CardBody>
    </Card>
  )
}

function Ratios({ grid }: { grid: SectionRatioGrid }) {
  return (
    <Card>
      <CardHead title={grid.title} sub={grid.sub} />
      <CardBody>
        {grid.items.length === 0 && (
          <p className="text-[12px] text-[#a8a6a0]">Ratios need a parsed financial statement.</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {grid.items.map((it) => (
            <div key={it.label} className="rounded-[20px] bg-[#efeeeb] p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11.5px] text-[#7c7a75]">{it.label}</p>
                {it.ok !== null && (
                  <span className={`text-[10px] font-bold ${it.ok ? 'text-[#16694a]' : 'text-[#b42318]'}`}>{it.ok ? 'OK' : 'Below'}</span>
                )}
              </div>
              <p className={`text-[16px] font-bold tnum ${it.value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{it.value ?? '—'}</p>
              <p className="text-[10.5px] text-[#7c7a75]">Benchmark {it.benchmark}</p>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}

function BandPanel({ panel }: { panel: SectionBandPanel }) {
  return (
    <Card>
      <CardHead title={panel.title} />
      <CardBody className="space-y-1.5">
        {panel.items.length === 0 && (
          <p className="py-2 text-[12px] text-[#a8a6a0]">Nothing recorded for this file yet.</p>
        )}
        {panel.items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-3 border-b border-[#e7e6e2] py-1.5 last:border-0">
            <span className="text-[11.5px] text-[#7c7a75]">{it.label}</span>
            {it.band ? <BandPill band={it.band} size="xs" /> : <span className="text-[11px] text-[#c9c7c1]">—</span>}
          </div>
        ))}
        {panel.metrics?.length ? (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {panel.metrics.map((m) => (
              <div key={m.label} className="rounded-[16px] bg-[#efeeeb] p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-[#7c7a75]">{m.label}</p>
                <p className={`text-[14px] font-bold tnum ${m.value ? 'text-[#16161a]' : 'text-[#c9c7c1]'}`}>{m.value ?? '—'}</p>
              </div>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  )
}

function SourcePrompt({ section, basePath, leadId }: { section: SectionView; basePath: string; leadId: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-dashed border-[#dcdbd6] bg-[#efeeeb]/70 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#16161a]">Nothing to score yet</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-[#7c7a75]">
          {section.sourceType
            ? <>Every figure below fills in from a parsed <strong className="text-[#5f5d58]">{section.sourceLabel.toLowerCase()}</strong>.</>
            : <>Every figure below fills in from the business profile on the Applicant tab.</>}
        </p>
      </div>
      <Link
        href={section.sourceType ? `${basePath}/${leadId}?tab=documents` : `${basePath}/${leadId}?tab=applicant`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#1a1917] px-4 py-2 text-[12px] font-semibold text-white hover:opacity-90"
      >
        <Upload size={13} />
        {section.sourceType ? `Upload ${section.sourceLabel.toLowerCase()}` : 'Complete business profile'}
      </Link>
    </div>
  )
}

function clamp(v: number | null | undefined): number | null {
  if (v === null || v === undefined || !Number.isFinite(v)) return null
  return Math.max(0, Math.min(100, v))
}
