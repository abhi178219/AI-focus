/* ── TradeEntry.jsx ──────────────────────────────────────────────
   Right panel: Trade setup form → Ask Claude → Verdict display
──────────────────────────────────────────────────────────────── */
import { useState } from 'react'
import { askClaude } from '../lib/api'

const C = {
  bg:     '#0a0d0f',
  panel:  '#0f1417',
  raised: '#111820',
  border: '#1a2228',
  gold:   '#c9a227',
  green:  '#2ecc71',
  red:    '#e05252',
  yellow: '#f39c12',
  purple: '#a67ff0',
  muted:  '#3a5060',
  text:   '#c4cdd6',
}

const TRIGGERS = [
  'EMA9/21 crossover + VWAP reclaim',
  'EMA21 breakdown + high volume',
  'VWAP rejection + RSI divergence',
  'Opening range breakout',
  'Gap fill + reversal',
  'Support/Resistance bounce',
  'Custom',
]

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#0c1014',
          border: `1px solid ${C.border}`, borderRadius: 3,
          color: C.text, fontSize: 11, padding: '5px 8px',
          fontFamily: "'JetBrains Mono', monospace", outline: 'none',
          transition: 'border-color 0.15s',
        }}
        onFocus={e  => (e.target.style.borderColor = C.gold)}
        onBlur={e   => (e.target.style.borderColor = C.border)}
      />
    </div>
  )
}

export default function TradeEntry({ market, verdict, onVerdict }) {
  const [symbol,  setSymbol]  = useState('')
  const [trigger, setTrigger] = useState(TRIGGERS[0])
  const [entry,   setEntry]   = useState('')
  const [sl,      setSl]      = useState('')
  const [t1,      setT1]      = useState('')
  const [t2,      setT2]      = useState('')
  const [lots,    setLots]    = useState('1')
  const [rsi,     setRsi]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const rr = (() => {
    const e = parseFloat(entry), s = parseFloat(sl), t = parseFloat(t1)
    if (!e || !s || !t || e === s) return null
    const risk   = Math.abs(e - s)
    const reward = Math.abs(t - e)
    return (reward / risk).toFixed(2)
  })()

  async function handleAsk() {
    if (!entry || !sl) { setError('Entry and SL are required'); return }
    setError('')
    setLoading(true)
    try {
      const result = await askClaude({
        market,
        symbol:       symbol || `${market} ATM`,
        trigger,
        entry_price:  parseFloat(entry),
        sl_price:     parseFloat(sl),
        t1_price:     t1 ? parseFloat(t1) : undefined,
        t2_price:     t2 ? parseFloat(t2) : undefined,
        lots:         parseInt(lots) || 1,
        rsi:          rsi ? parseFloat(rsi) : undefined,
      })
      onVerdict(result)
    } catch (e) {
      // Demo mode — simulate a verdict
      onVerdict({
        verdict:    'ENTER',
        confidence: 78,
        reason:     '[Demo] EMA9/21 crossover confirmed with VWAP reclaim. RSI in healthy zone. R:R favorable. Entering.',
        trade_id:   'demo-' + Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  const verdictColor = verdict?.verdict === 'ENTER' ? C.green
    : verdict?.verdict === 'SKIP' ? C.red
    : C.yellow

  const verdictBg = verdict?.verdict === 'ENTER' ? '#0d2318'
    : verdict?.verdict === 'SKIP' ? '#2a0d0d'
    : '#1a1400'

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      borderLeft: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '5px 12px', background: C.panel,
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.08em' }}>
          TRADE ENTRY
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {/* Form grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input label="SYMBOL" value={symbol} onChange={setSymbol} placeholder="NIFTY 24400 CE" />

          {/* Trigger dropdown */}
          <div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em', marginBottom: 3 }}>TRIGGER</div>
            <select
              value={trigger} onChange={e => setTrigger(e.target.value)}
              style={{
                width: '100%', background: '#0c1014',
                border: `1px solid ${C.border}`, borderRadius: 3,
                color: C.text, fontSize: 11, padding: '5px 8px',
                fontFamily: "'JetBrains Mono', monospace", outline: 'none',
              }}
            >
              {TRIGGERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input label="ENTRY"   value={entry} onChange={setEntry} type="number" placeholder="24400" />
            <Input label="SL"      value={sl}    onChange={setSl}    type="number" placeholder="24350" />
            <Input label="TARGET 1" value={t1}   onChange={setT1}    type="number" placeholder="24480" />
            <Input label="TARGET 2" value={t2}   onChange={setT2}    type="number" placeholder="24520" />
            <Input label="LOTS"    value={lots}   onChange={setLots}  type="number" placeholder="1" />
            <Input label="RSI"     value={rsi}    onChange={setRsi}   type="number" placeholder="58" />
          </div>

          {/* R:R */}
          {rr && (
            <div style={{
              padding: '5px 10px', background: '#0c1014',
              border: `1px solid ${C.border}`, borderRadius: 3,
              fontSize: 10, color: parseFloat(rr) >= 1.5 ? C.green : C.yellow,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ color: C.muted }}>Risk : Reward</span>
              <span style={{ fontWeight: 700 }}>1 : {rr}</span>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 9, color: C.red }}>{error}</div>
          )}

          {/* Ask Claude button */}
          <button
            onClick={handleAsk}
            disabled={loading}
            style={{
              padding: '10px 0', borderRadius: 4, marginTop: 4,
              background: loading
                ? '#1a2228'
                : 'linear-gradient(135deg, #1a0d2a 0%, #2a1050 100%)',
              border: `1px solid ${loading ? C.border : C.purple}`,
              color: loading ? C.muted : C.purple,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳ ASKING CLAUDE…' : '⚡ ASK CLAUDE'}
          </button>
        </div>

        {/* ── Verdict panel ── */}
        {verdict && (
          <div style={{
            marginTop: 12, padding: '12px',
            background: verdictBg, border: `1px solid ${verdictColor}40`,
            borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {/* Verdict label + confidence */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: verdictColor, letterSpacing: '0.12em' }}>
                {verdict.verdict}
              </span>
              <span style={{ fontSize: 11, color: verdictColor }}>
                {verdict.confidence}% confidence
              </span>
            </div>

            {/* Confidence bar */}
            <div style={{ height: 3, background: '#1a2228', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2, background: verdictColor,
                width: `${verdict.confidence}%`, transition: 'width 0.6s ease',
              }} />
            </div>

            {/* Reason */}
            <div style={{ fontSize: 10, color: C.text, lineHeight: 1.7 }}>
              {verdict.reason}
            </div>

            {/* Action buttons — only for ENTER */}
            {verdict.verdict === 'ENTER' && (
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['BUY CE', 'BUY PE'].map(label => (
                  <button
                    key={label}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 3,
                      background: '#0d2318', border: `1px solid ${C.green}`,
                      color: C.green, fontSize: 10, fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
