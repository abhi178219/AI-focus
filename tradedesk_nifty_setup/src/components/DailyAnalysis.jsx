/* ── DailyAnalysis.jsx ───────────────────────────────────────────
   Bottom row split:
     Left  62%: Pattern cards / Claude errors / New rules / Deploy
     Right 38%: 6-metric grid
──────────────────────────────────────────────────────────────── */

const C = {
  bg:     '#0a0d0f',
  panel:  '#0f1417',
  border: '#1a2228',
  gold:   '#c9a227',
  green:  '#2ecc71',
  red:    '#e05252',
  yellow: '#f39c12',
  purple: '#a67ff0',
  muted:  '#3a5060',
  text:   '#c4cdd6',
}

function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: '#0c1014', border: `1px solid ${C.border}`,
      borderRadius: 4, padding: '10px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 9, color: C.muted, letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, color: color || C.text }}>{value}</span>
      {sub && <span style={{ fontSize: 9, color: C.muted }}>{sub}</span>}
    </div>
  )
}

function PatternCard({ text, type }) {
  const cfg = {
    working: { color: C.green,  icon: '✓', bg: '#0d2318', border: '#1a4030' },
    failed:  { color: C.red,    icon: '✗', bg: '#2a0d0d', border: '#4a1515' },
    error:   { color: C.yellow, icon: '⚠', bg: '#1a1400', border: '#3a3000' },
    rule:    { color: C.purple, icon: '→', bg: '#1a0d2a', border: '#3a1a5a' },
  }[type] ?? { color: C.muted, icon: '·', bg: '#0f1417', border: C.border }

  return (
    <div style={{
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 3, padding: '6px 10px',
      display: 'flex', gap: 8, alignItems: 'flex-start',
      marginBottom: 4,
    }}>
      <span style={{ color: cfg.color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
      <span style={{ fontSize: 10, color: C.text, lineHeight: 1.6 }}>{text}</span>
    </div>
  )
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: color || C.muted,
      letterSpacing: '0.1em', marginBottom: 6, marginTop: 10,
    }}>
      {children}
    </div>
  )
}

function EmptyAnalysis({ market, onTrigger, deploying }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: 12,
    }}>
      <span style={{ fontSize: 28 }}>📊</span>
      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 1.8 }}>
        No daily review yet for <span style={{ color: C.gold }}>{market}</span>
        <br />Run analysis after the session closes.
      </div>
      <button
        onClick={onTrigger}
        disabled={deploying}
        style={{
          padding: '8px 20px', borderRadius: 3,
          background: deploying ? '#1a2228' : '#1a0d2a',
          border: `1px solid ${deploying ? C.border : C.purple}`,
          color: deploying ? C.muted : C.purple,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          cursor: deploying ? 'not-allowed' : 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {deploying ? '⏳ ANALYSING…' : '▶ RUN ANALYSIS NOW'}
      </button>
    </div>
  )
}

export default function DailyAnalysis({
  review, loading, deploying, market, onDeploy, onTrigger,
}) {
  if (loading) {
    return (
      <div style={{
        height: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: C.muted, fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        Loading analysis…
      </div>
    )
  }

  const falseTriggerCount = typeof review?.false_triggers === 'number'
    ? review.false_triggers
    : (review?.false_triggers?.length ?? 0)

  return (
    <div style={{
      height: '100%', display: 'flex',
      borderTop: `1px solid ${C.border}`, overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* ── LEFT: Analysis panels ── */}
      <div style={{
        flex: '0 0 62%', display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${C.border}`, overflow: 'hidden',
      }}>
        <div style={{
          padding: '6px 12px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.panel, flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.08em' }}>
            DAILY ANALYSIS
          </span>
          {review && (
            <span style={{ fontSize: 9, color: C.muted }}>
              {review.date} · {market} · {review.total_trades} trades
            </span>
          )}
        </div>

        {!review ? (
          <EmptyAnalysis market={market} onTrigger={onTrigger} deploying={deploying} />
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
            {review.full_analysis && (
              <div style={{
                fontSize: 10, color: C.text, lineHeight: 1.7,
                background: '#0c1014', border: `1px solid ${C.border}`,
                borderRadius: 3, padding: '8px 12px', marginBottom: 4,
              }}>
                {review.full_analysis}
              </div>
            )}

            {review.patterns_found?.length > 0 && (
              <>
                <SectionLabel color={C.green}>WHAT WORKED</SectionLabel>
                {review.patterns_found.map((p, i) => <PatternCard key={i} text={p} type="working" />)}
              </>
            )}

            {review.claude_errors?.length > 0 && (
              <>
                <SectionLabel color={C.yellow}>CLAUDE ERRORS</SectionLabel>
                {review.claude_errors.map((e, i) => <PatternCard key={i} text={e} type="error" />)}
              </>
            )}

            {review.false_triggers > 0 && (
              <>
                <SectionLabel color={C.red}>FALSE TRIGGERS</SectionLabel>
                <PatternCard text={`${falseTriggerCount} false signal(s) detected`} type="failed" />
              </>
            )}

            {review.new_rules?.length > 0 && (
              <>
                <SectionLabel color={C.purple}>PROPOSED NEW RULES</SectionLabel>
                {review.new_rules.map((r, i) => <PatternCard key={i} text={r} type="rule" />)}
              </>
            )}

            {/* Approve + Deploy */}
            {review.new_rules?.length > 0 && !review.deployed && (
              <div style={{ marginTop: 12, marginBottom: 4 }}>
                <button
                  onClick={onDeploy}
                  disabled={deploying}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: deploying
                      ? '#1a2228'
                      : 'linear-gradient(135deg, #0d2318 0%, #1a4030 100%)',
                    border: `1px solid ${deploying ? C.border : C.green}`,
                    borderRadius: 4, color: deploying ? C.muted : C.green,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                    cursor: deploying ? 'not-allowed' : 'pointer',
                    fontFamily: "'JetBrains Mono', monospace", transition: 'all 0.2s',
                  }}
                >
                  {deploying
                    ? '⏳ DEPLOYING RULES…'
                    : `✓ APPROVE + DEPLOY ${review.new_rules.length} NEW RULES → SUPABASE`}
                </button>
                <div style={{ fontSize: 9, color: C.muted, textAlign: 'center', marginTop: 6 }}>
                  Writes rules to ai_rules table — Claude uses them in all future signals
                </div>
              </div>
            )}

            {review.deployed && (
              <div style={{
                marginTop: 12, padding: '8px 12px', borderRadius: 3,
                background: '#0d2318', border: `1px solid ${C.green}`,
                fontSize: 10, color: C.green, textAlign: 'center',
              }}>
                ✓ Rules deployed to Supabase — brain updated
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT: Metrics grid ── */}
      <div style={{ flex: '0 0 38%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '6px 12px', borderBottom: `1px solid ${C.border}`,
          background: C.panel, flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: '0.08em' }}>
            SESSION METRICS
          </span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {review ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <MetricCard
                label="WIN RATE"
                value={`${Math.round(review.win_rate ?? 0)}%`}
                color={(review.win_rate ?? 0) >= 50 ? C.green : C.red}
                sub={`${review.win_count ?? 0}W · ${review.loss_count ?? 0}L`}
              />
              <MetricCard
                label="GROSS PnL"
                value={`₹${((review.gross_pnl ?? 0) / 1000).toFixed(1)}k`}
                color={(review.gross_pnl ?? 0) >= 0 ? C.green : C.red}
                sub="today's session"
              />
              <MetricCard
                label="FALSE TRIGGERS"
                value={falseTriggerCount}
                color={C.red}
                sub="avoided"
              />
              <MetricCard
                label="AVG CONFIDENCE"
                value={`${Math.round(review.avg_confidence ?? 0)}%`}
                color={C.purple}
                sub="Claude's certainty"
              />
              <MetricCard
                label="TOTAL SIGNALS"
                value={review.total_signals ?? review.total_trades ?? 0}
                color={C.text}
              />
              <MetricCard
                label="NEW RULES"
                value={review.new_rules?.length ?? 0}
                color={C.gold}
                sub="proposed today"
              />
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: C.muted, fontSize: 10, textAlign: 'center',
            }}>
              Run daily analysis to<br />see session metrics
            </div>
          )}

          <div style={{
            marginTop: 12, padding: '8px 10px',
            background: '#0c1014', border: `1px solid ${C.border}`,
            borderRadius: 3, fontSize: 9, color: C.muted, lineHeight: 1.7,
          }}>
            💡 Scheduler auto-triggers review at{' '}
            <span style={{ color: C.gold }}>15:30 IST</span> (NIFTY) and{' '}
            <span style={{ color: C.gold }}>23:30 IST</span> (XAUUSD).
            Deploy approved rules to make Claude smarter tomorrow.
          </div>
        </div>
      </div>
    </div>
  )
}
