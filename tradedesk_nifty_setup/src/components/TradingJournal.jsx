/* ── TradingJournal.jsx ──────────────────────────────────────────
   Middle row: real-time trade table with stat bar and expandable
   Claude reasoning / outcome logger.
──────────────────────────────────────────────────────────────── */
import { useState } from 'react'
import { logOutcome } from '../lib/api'

const C = {
  bg:     '#0a0d0f',
  panel:  '#0f1417',
  row:    '#0c1014',
  rowAlt: '#0e1318',
  border: '#1a2228',
  gold:   '#c9a227',
  green:  '#2ecc71',
  red:    '#e05252',
  yellow: '#f39c12',
  purple: '#a67ff0',
  muted:  '#3a5060',
  text:   '#c4cdd6',
}

const STATUS_CFG = {
  WIN:  { color: C.green,  bg: '#0d2318', label: 'WIN'  },
  LOSS: { color: C.red,    bg: '#2a0d0d', label: 'LOSS' },
  BE:   { color: C.yellow, bg: '#1a1400', label: 'BE'   },
  OPEN: { color: C.muted,  bg: '#0f1417', label: 'OPEN' },
}

const VERDICT_CFG = {
  ENTER:  { color: C.green,  label: 'ENTER'  },
  SKIP:   { color: C.red,    label: 'SKIP'   },
  WAIT:   { color: C.yellow, label: 'WAIT'   },
  MANUAL: { color: C.muted,  label: 'MANUAL' },
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 1,
      padding: '5px 14px', borderRight: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || C.text }}>{value}</span>
      {sub && <span style={{ fontSize: 9, color: C.muted }}>{sub}</span>}
    </div>
  )
}

function ReasonRow({ trade, onClose }) {
  const [exitPrice, setExitPrice] = useState('')
  const [pnl,       setPnl]       = useState('')
  const [status,    setStatus]    = useState('WIN')
  const [logging,   setLogging]   = useState(false)

  async function handleLog() {
    if (!exitPrice) return
    setLogging(true)
    try {
      await logOutcome({
        trade_id:   trade.id,
        status,
        exit_price: parseFloat(exitPrice),
        pnl_rs:     parseFloat(pnl) || 0,
      })
      onClose?.()
    } catch {
      // silently fail in demo mode
      onClose?.()
    } finally {
      setLogging(false)
    }
  }

  return (
    <tr>
      <td colSpan={9} style={{ background: '#080b0d', padding: 0 }}>
        <div style={{
          padding: '12px 16px',
          display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16,
          borderBottom: `1px solid ${C.border}`,
        }}>
          {/* Reasoning */}
          <div>
            <div style={{ fontSize: 9, color: C.purple, letterSpacing: '0.08em', marginBottom: 6 }}>
              CLAUDE'S REASONING
            </div>
            <div style={{
              fontSize: 10, color: C.text, lineHeight: 1.8,
              background: '#0a0d10', border: `1px solid ${C.border}`,
              borderRadius: 3, padding: '8px 12px',
            }}>
              {trade.claude_reason || 'No reasoning recorded.'}
            </div>
          </div>

          {/* Log outcome */}
          {trade.status === 'OPEN' && (
            <div style={{
              background: '#0f1417', border: `1px solid ${C.border}`,
              borderRadius: 4, padding: 12, display: 'flex',
              flexDirection: 'column', gap: 8,
            }}>
              <div style={{ fontSize: 9, color: C.gold, letterSpacing: '0.08em' }}>LOG OUTCOME</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'EXIT PRICE', val: exitPrice, set: setExitPrice, ph: '24398' },
                  { label: 'PnL (₹)',    val: pnl,       set: setPnl,       ph: '5720'  },
                ].map(({ label, val, set, ph }) => (
                  <div key={label}>
                    <div style={{ fontSize: 9, color: C.muted, marginBottom: 3 }}>{label}</div>
                    <input
                      type="number" value={val}
                      onChange={e => set(e.target.value)}
                      placeholder={ph}
                      style={{
                        width: '100%', background: '#0d1316',
                        border: `1px solid ${C.border}`, borderRadius: 3,
                        color: C.text, fontSize: 10, padding: '4px 6px',
                        fontFamily: "'JetBrains Mono', monospace", outline: 'none',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 4 }}>
                {['WIN', 'LOSS', 'BE'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      flex: 1, padding: '4px 0',
                      background: status === s ? STATUS_CFG[s].bg : 'none',
                      border: `1px solid ${status === s ? STATUS_CFG[s].color : C.border}`,
                      borderRadius: 3, color: status === s ? STATUS_CFG[s].color : C.muted,
                      fontSize: 9, fontWeight: 700, cursor: 'pointer',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleLog}
                disabled={logging || !exitPrice}
                style={{
                  padding: '6px 0', borderRadius: 3,
                  background: logging ? '#1a2228' : '#0d2318',
                  border: `1px solid ${logging ? C.border : C.green}`,
                  color: logging ? C.muted : C.green,
                  fontSize: 10, fontWeight: 700,
                  cursor: logging ? 'not-allowed' : 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {logging ? 'SAVING…' : '✓ SAVE OUTCOME'}
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

const COLS = [
  { key: 'time',    label: 'TIME',    w: 56  },
  { key: 'symbol',  label: 'SYMBOL',  w: 140 },
  { key: 'trigger', label: 'TRIGGER', w: 150 },
  { key: 'entry',   label: 'ENTRY',   w: 68  },
  { key: 'sl',      label: 'SL',      w: 68  },
  { key: 't1',      label: 'T1',      w: 68  },
  { key: 'claude',  label: 'CLAUDE',  w: 70  },
  { key: 'status',  label: 'STATUS',  w: 58  },
  { key: 'pnl',     label: 'PnL',     w: 80  },
]

export default function TradingJournal({ trades = [], stats = {}, loading, market }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      borderTop: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      {/* Stats bar */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, background: C.panel,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '0 14px', borderRight: `1px solid ${C.border}`,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.08em' }}>
            JOURNAL
          </span>
        </div>
        <StatCard label="TRADES"   value={stats.total  ?? 0} />
        <StatCard label="WIN RATE" value={`${stats.winRate ?? 0}%`}
          color={(stats.winRate ?? 0) >= 50 ? C.green : C.red} />
        <StatCard label="WINS"     value={stats.wins   ?? 0} color={C.green} />
        <StatCard label="LOSSES"   value={stats.losses ?? 0} color={C.red}   />
        <StatCard
          label="GROSS PnL"
          value={`₹${((stats.grossPnl ?? 0)).toLocaleString('en-IN')}`}
          color={(stats.grossPnl ?? 0) >= 0 ? C.green : C.red}
        />
        <StatCard label="OPEN" value={stats.open ?? 0} color={C.yellow} />
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          <span style={{ fontSize: 9, color: C.muted }}>
            {loading ? 'Loading…' : `Today · ${market} · Real-time`}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          fontSize: 10, tableLayout: 'fixed',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <colgroup>
            {COLS.map(c => <col key={c.key} style={{ width: c.w }} />)}
          </colgroup>
          <thead>
            <tr style={{ background: '#0c1014', position: 'sticky', top: 0, zIndex: 1 }}>
              {COLS.map(c => (
                <th key={c.key} style={{
                  padding: '5px 8px', textAlign: 'left',
                  color: C.muted, fontWeight: 700, fontSize: 9,
                  letterSpacing: '0.06em', borderBottom: `1px solid ${C.border}`,
                }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!loading && trades.length === 0 && (
              <tr>
                <td colSpan={9} style={{
                  padding: 24, textAlign: 'center',
                  color: C.muted, fontSize: 10,
                }}>
                  No trades today · Take a trade to see it here
                </td>
              </tr>
            )}

            {trades.map((trade, i) => {
              const sc = STATUS_CFG[trade.status]  || STATUS_CFG.OPEN
              const vc = VERDICT_CFG[trade.claude_verdict] || VERDICT_CFG.MANUAL
              const isExpanded = expanded === trade.id
              const pnlColor = trade.pnl_rs > 0 ? C.green : trade.pnl_rs < 0 ? C.red : C.muted

              return (
                <>
                  <tr
                    key={trade.id}
                    onClick={() => setExpanded(prev => prev === trade.id ? null : trade.id)}
                    style={{
                      background: isExpanded ? '#0c1418' : i % 2 === 0 ? C.row : C.rowAlt,
                      cursor: 'pointer',
                      borderLeft: isExpanded ? `2px solid ${C.purple}` : '2px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '5px 8px', color: C.muted }}>
                      {new Date(trade.created_at).toLocaleTimeString('en-IN', {
                        timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trade.symbol}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {trade.trigger_name}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.text, fontWeight: 600 }}>
                      {trade.entry_price?.toFixed(2)}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.red }}>
                      {trade.sl_price?.toFixed(2)}
                    </td>
                    <td style={{ padding: '5px 8px', color: C.green }}>
                      {trade.t1_price?.toFixed(2) || '—'}
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{
                        background: vc.color + '1a', color: vc.color,
                        padding: '1px 6px', borderRadius: 2, fontSize: 9, fontWeight: 700,
                      }}>
                        {vc.label}{trade.confidence ? ` ${trade.confidence}%` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>
                      <span style={{
                        background: sc.bg, color: sc.color,
                        padding: '1px 6px', borderRadius: 2, fontSize: 9, fontWeight: 700,
                      }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px', color: pnlColor, fontWeight: 600 }}>
                      {trade.pnl_rs != null
                        ? `₹${trade.pnl_rs.toLocaleString('en-IN')}`
                        : <span style={{ color: C.muted }}>—</span>
                      }
                    </td>
                  </tr>

                  {isExpanded && (
                    <ReasonRow
                      key={`${trade.id}-expand`}
                      trade={trade}
                      onClose={() => setExpanded(null)}
                    />
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
