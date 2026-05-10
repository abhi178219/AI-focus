/* ── CandleChart.jsx ─────────────────────────────────────────────
   lightweight-charts v5 candlestick chart with EMA9 / EMA21 / VWAP
   overlays. Generates synthetic demo candles when no real data feed
   is connected.
──────────────────────────────────────────────────────────────── */
import { useEffect, useRef } from 'react'

const C = {
  bg:     '#0a0d0f',
  panel:  '#0f1417',
  border: '#1a2228',
  gold:   '#c9a227',
  green:  '#2ecc71',
  red:    '#e05252',
  purple: '#a67ff0',
  orange: '#e67e22',
  muted:  '#3a5060',
  text:   '#c4cdd6',
}

/* ── EMA helper ─────────────────────────────────────────────── */
function calcEMA(closes, period) {
  const k   = 2 / (period + 1)
  const out = []
  let   ema = closes[0]
  for (let i = 0; i < closes.length; i++) {
    ema = i === 0 ? closes[0] : closes[i] * k + ema * (1 - k)
    out.push(ema)
  }
  return out
}

/* ── VWAP helper ─────────────────────────────────────────────── */
function calcVWAP(candles) {
  let cumPV = 0, cumV = 0
  return candles.map(b => {
    const tp = (b.high + b.low + b.close) / 3
    cumPV += tp * (b.volume || 1)
    cumV  += (b.volume || 1)
    return cumPV / cumV
  })
}

/* ── Synthetic demo data ─────────────────────────────────────── */
function genDemoCandles(market = 'NIFTY', n = 80) {
  const seedPrice = market === 'NIFTY' ? 24350 : market === 'XAUUSD' ? 2320 : 1.0870
  const vol       = market === 'NIFTY' ? 0.0035 : market === 'XAUUSD' ? 0.004 : 0.0025

  const now  = Math.floor(Date.now() / 1000)
  const step = 5 * 60 // 5-minute bars
  const bars = []
  let price  = seedPrice

  for (let i = n - 1; i >= 0; i--) {
    const time  = now - i * step
    const drift = (Math.random() - 0.48) * vol * price
    const range = Math.abs(drift) * (1 + Math.random())
    const open  = price
    const close = price + drift
    const high  = Math.max(open, close) + range * Math.random()
    const low   = Math.min(open, close) - range * Math.random()
    bars.push({ time, open, high, low, close, volume: Math.floor(Math.random() * 10000 + 2000) })
    price = close
  }
  return bars
}

/* ── Component ──────────────────────────────────────────────── */
export default function CandleChart({ market = 'NIFTY', timeframe = '5M', verdict }) {
  const containerRef = useRef(null)
  const chartRef     = useRef(null)
  const candleRef    = useRef(null)
  const ema9Ref      = useRef(null)
  const ema21Ref     = useRef(null)
  const vwapRef      = useRef(null)
  const lastPrice    = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    let chart, cleanup

    async function init() {
      const lc = await import('lightweight-charts')

      chart = lc.createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        layout: {
          background: { type: lc.ColorType.Solid, color: C.bg },
          textColor:  C.text,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize:   10,
        },
        grid: {
          vertLines:   { color: C.border, style: lc.LineStyle.Dotted },
          horzLines:   { color: C.border, style: lc.LineStyle.Dotted },
        },
        crosshair: {
          mode: lc.CrosshairMode.Normal,
          vertLine: { color: C.gold + '66', labelBackgroundColor: C.panel },
          horzLine: { color: C.gold + '66', labelBackgroundColor: C.panel },
        },
        rightPriceScale: {
          borderColor:  C.border,
          textColor:    C.muted,
          scaleMargins: { top: 0.08, bottom: 0.12 },
        },
        timeScale: {
          borderColor:     C.border,
          timeVisible:     true,
          secondsVisible:  false,
          tickMarkFormatter: (t) => {
            const d = new Date(t * 1000)
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
          },
        },
        handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      })

      chartRef.current = chart

      // Candlestick series
      const candleSeries = chart.addSeries(lc.CandlestickSeries, {
        upColor:        C.green,
        downColor:      C.red,
        borderUpColor:  C.green,
        borderDownColor:C.red,
        wickUpColor:    C.green + 'aa',
        wickDownColor:  C.red   + 'aa',
      })
      candleRef.current = candleSeries

      // EMA9
      const ema9Series = chart.addSeries(lc.LineSeries, {
        color:       C.green,
        lineWidth:   1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'EMA9',
      })
      ema9Ref.current = ema9Series

      // EMA21
      const ema21Series = chart.addSeries(lc.LineSeries, {
        color:       C.orange,
        lineWidth:   1,
        priceLineVisible: false,
        lastValueVisible: false,
        title: 'EMA21',
      })
      ema21Ref.current = ema21Series

      // VWAP
      const vwapSeries = chart.addSeries(lc.LineSeries, {
        color:          C.purple,
        lineWidth:      1,
        lineStyle:      lc.LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: true,
        title: 'VWAP',
      })
      vwapRef.current = vwapSeries

      // Load demo data
      const candles = genDemoCandles(market)
      const closes  = candles.map(b => b.close)
      const ema9    = calcEMA(closes, 9)
      const ema21   = calcEMA(closes, 21)
      const vwap    = calcVWAP(candles)

      candleSeries.setData(candles)
      ema9Series.setData(candles.map((b, i) => ({ time: b.time, value: ema9[i] })))
      ema21Series.setData(candles.map((b, i) => ({ time: b.time, value: ema21[i] })))
      vwapSeries.setData(candles.map((b, i) => ({ time: b.time, value: vwap[i] })))

      lastPrice.current = candles[candles.length - 1].close

      chart.timeScale().fitContent()

      // ResizeObserver for responsive sizing
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) {
          chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
        }
      })
      ro.observe(containerRef.current)
      cleanup = () => { ro.disconnect(); chart.remove() }
    }

    init()
    return () => cleanup?.()
  }, [market])

  // Add signal marker when verdict changes
  useEffect(() => {
    if (!candleRef.current || !verdict) return
    const now = Math.floor(Date.now() / 1000)
    const markers = [{
      time:     now,
      position: verdict === 'ENTER' ? 'belowBar' : 'aboveBar',
      color:    verdict === 'ENTER' ? C.green : verdict === 'SKIP' ? C.red : C.gold,
      shape:    verdict === 'ENTER' ? 'arrowUp' : 'arrowDown',
      text:     verdict,
    }]
    candleRef.current.setMarkers?.(markers)
  }, [verdict])

  const p = lastPrice.current
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mini header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '4px 10px', background: C.panel,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>{market}</span>
        <span style={{ fontSize: 9,  color: C.muted }}>{timeframe}</span>
        {p && (
          <span style={{ fontSize: 10, color: C.text, marginLeft: 6 }}>
            {p.toFixed(market === 'NIFTY' ? 0 : 4)}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[
            { label: 'EMA9',  color: C.green  },
            { label: 'EMA21', color: C.orange },
            { label: 'VWAP',  color: C.purple },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color }}>
              <span style={{ display: 'inline-block', width: 16, height: 2, background: color, borderRadius: 1 }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ flex: 1 }} />
    </div>
  )
}
