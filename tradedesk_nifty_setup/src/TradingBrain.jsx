/* ── TradingBrain.jsx ────────────────────────────────────────────
   4-panel grid:
     Row 1 (48%): CandleChart (62%) | TradeEntry (38%)
     Row 2 (23%): TradingJournal
     Row 3 (29%): DailyAnalysis
──────────────────────────────────────────────────────────────── */
import { useState } from 'react'
import CandleChart    from './components/CandleChart'
import TradeEntry     from './components/TradeEntry'
import TradingJournal from './components/TradingJournal'
import DailyAnalysis  from './components/DailyAnalysis'
import { useTodayTrades } from './hooks/useTrades'
import { useAnalysis }    from './hooks/useAnalysis'

const C = {
  bg:     '#0a0d0f',
  panel:  '#0f1417',
  border: '#1a2228',
  gold:   '#c9a227',
  purple: '#a67ff0',
  muted:  '#3a5060',
  text:   '#c4cdd6',
  green:  '#2ecc71',
  red:    '#e05252',
}

const MARKETS    = ['NIFTY', 'XAUUSD', 'EURUSD']
const TIMEFRAMES = ['1M', '5M', '15M', '1H']

export default function TradingBrain() {
  const [market,    setMarket]    = useState('NIFTY')
  const [timeframe, setTimeframe] = useState('5M')
  const [verdict,   setVerdict]   = useState(null)

  const { trades, stats, loading: tradesLoading } = useTodayTrades(market)
  const {
    review, loading: reviewLoading, deploying,
    deployReview, triggerReview,
  } = useAnalysis(market)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* ── Sub-header: Market + Timeframe ─────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderBottom: `1px solid ${C.border}`,
        background: C.panel, flexShrink: 0,
      }}>
        {/* Market pills */}
        <div style={{ display: 'flex', gap: 4 }}>
          {MARKETS.map(m => (
            <button
              key={m}
              onClick={() => { setMarket(m); setVerdict(null) }}
              style={{
                background: market === m ? '#1a0d2a' : 'none',
                border: `1px solid ${market === m ? C.purple : C.border}`,
                color:   market === m ? C.purple : C.muted,
                padding: '2px 12px', borderRadius: 3,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 16, background: C.border, margin: '0 4px' }} />

        {/* Timeframe pills */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TIMEFRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                background: 'none', border: 'none',
                color: timeframe === tf ? C.gold : C.muted,
                padding: '2px 8px', fontSize: 9, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                borderBottom: timeframe === tf
                  ? `1px solid ${C.gold}`
                  : '1px solid transparent',
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: last signal + date */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {verdict && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '2px 10px', borderRadius: 3,
              background: verdict.verdict === 'ENTER' ? '#0d2318'
                : verdict.verdict === 'SKIP'  ? '#2a0d0d' : '#1a1400',
              border: `1px solid ${
                verdict.verdict === 'ENTER' ? C.green
                  : verdict.verdict === 'SKIP' ? C.red : '#f39c12'
              }`,
            }}>
              <span style={{ fontSize: 9, color: C.muted }}>Last signal:</span>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: verdict.verdict === 'ENTER' ? C.green
                  : verdict.verdict === 'SKIP' ? C.red : '#f39c12',
              }}>
                {verdict.verdict} · {verdict.confidence}%
              </span>
            </div>
          )}
          <span style={{ fontSize: 9, color: C.muted }}>
            {market} · {new Date().toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateRows: '48% 23% 29%',
        overflow: 'hidden',
      }}>
        {/* Row 1 — Chart + Trade Entry */}
        <div style={{
          display: 'grid', gridTemplateColumns: '62% 38%',
          borderBottom: `1px solid ${C.border}`, overflow: 'hidden',
        }}>
          <CandleChart
            market={market}
            timeframe={timeframe}
            verdict={verdict?.verdict}
          />
          <TradeEntry
            market={market}
            verdict={verdict}
            onVerdict={setVerdict}
          />
        </div>

        {/* Row 2 — Trading Journal */}
        <div style={{ overflow: 'hidden' }}>
          <TradingJournal
            trades={trades}
            stats={stats}
            loading={tradesLoading}
            market={market}
          />
        </div>

        {/* Row 3 — Daily Analysis */}
        <div style={{ overflow: 'hidden' }}>
          <DailyAnalysis
            review={review}
            loading={reviewLoading}
            deploying={deploying}
            market={market}
            onDeploy={deployReview}
            onTrigger={triggerReview}
          />
        </div>
      </div>
    </div>
  )
}
