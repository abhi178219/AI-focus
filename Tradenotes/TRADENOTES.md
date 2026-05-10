# Tradenotes — NIFTY Scalping Reference

> Personal reference notes for intraday NIFTY trading. Updated via Claude + TradingView MCP.

---

## Current Chart Setup
- **Symbol:** NSE:NIFTY
- **Chart URL:** https://in.tradingview.com/chart/78st7HYx/?symbol=NSE%3ANIFTY
- **Active Indicator:** EMA33 + VWAP + RSI + DI (custom, see TradingView-Indicator folder)

---

## Key S/R Levels (as of Apr 17, 2026)

| Level | Price | Type |
|---|---|---|
| R1 — Swing High Zone | 24,400 | Resistance |
| Minor Resistance | 24,323 | Resistance |
| S1 — Immediate Support | 24,196 | Support |
| S2 — Strong Cluster | 24,100 | Support |

> Fibonacci levels (61.8%, 50%, 38.2%) were hidden — re-draw if needed.
> Swing range: 22,183 (low) → 26,373 (high). Current price near 50% Fib (24,278).

---

## Scalp Trade Template

**LONG Setup:**
- Price holds above 24,278 (50% Fib)
- EMA33 band below price
- Price above VWAP
- RSI > 55, +DI > 25
- Entry: break + hold above 24,323
- Target 1: 24,400 | Target 2: 24,572
- Stop: below 24,196

**SHORT Setup:**
- Rejection at 24,323–24,400 zone
- Price below VWAP
- RSI < 45, -DI > 25
- Entry: break below 24,196
- Target 1: 24,100 | Target 2: 23,842
- Stop: above 24,350

---

## MCP TradingView Tools Quick Reference

| Task | MCP Tool |
|---|---|
| Health check | `tv_health_check` |
| Get live price | `quote_get` |
| Read indicators | `data_get_study_values` |
| Draw S/R lines | `draw_shape` (horizontal_line) |
| Clear drawings | `draw_clear` |
| Load Pine Script | `pine_set_source` → `pine_smart_compile` |
| Screenshot chart | `capture_screenshot` |
| Change timeframe | `chart_set_timeframe` |
| Change symbol | `chart_set_symbol` |

---

## Rules.json Strategy (10-Second Scalper)
- Watchlist: BTCUSDT (demo)
- Default TF: 1-minute
- Signal: Price momentum + RSI 30–70 filter
- Entry: Market order if close > prev close by 0.05%
- Exit: Time-based, 10 seconds
- Risk: 1% portfolio, max $3 per trade, 6 trades/min
- For demo/YouTube only

---

## Session Notes Log

| Date | Symbol | Bias | Entry | Exit | Result | Notes |
|---|---|---|---|---|---|---|
| Apr 17, 2026 | NIFTY | — | — | — | — | Setup day. Indicator loaded. S/R drawn. |
| Apr 29, 2026 | NIFTYK2026 | SHORT | 24,320 | 24,274 (partial) | +46 pts | Short triggered on VWAP + FVG break. Distribution at 24,450. Volume 115K climax bar. |
| Apr 30, 2026 | NIFTYK2026 | LONG | 23,980 | Active | +4 pts (holding) | Breakout long after accumulation at 23,855. Trigger: bar close 23,980 vol 53K above EMA High. |

---

## FVG Analysis — NSE:NIFTYK2026 (Apr 29, 2026)

> Drawn on 5-minute chart. Symbol: NSE:NIFTYK2026 (May Futures). Analysis date: Apr 29, 2026.

---

### Visual Price Map

```
Price     Zone / Label                          Type
─────────────────────────────────────────────────────────────────
24,450  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← Distribution High (Apr 29 session)
        │  🔴 DISTRIBUTION ZONE              │  8 bars, 19K–54K vol, sellers loading
24,405  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← Day High Resistance [H781dC]
        │                                    │
24,347  ╔═══════════════════════════════════╗ ← Bullish FVG TOP [JnUatQ]
24,335  ╚═══════════════════════════════════╝ ← Bullish FVG BTM  🟢 DEMAND
        │  ⚡ SHORT triggered here (24,320)  │
24,332  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← VWAP (Apr 29)
24,320  ←  SHORT ENTRY (115K vol bar)       │
        │                                    │
24,315  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← HVN / POC [d0g7Y3]
        │                                    │
24,303  ╔═══════════════════════════════════╗ ← Bullish FVG TOP [JMGBrh]
24,285  ╚═══════════════════════════════════╝ ← Bullish FVG BTM  🟢 DEMAND
        │                                    │
24,274  ←  Short LOW (partial exit zone)    │
24,250  ←  Short TARGET 1                   │
        │                                    │
24,237  ╔═══════════════════════════════════╗ ← KEY Bullish FVG TOP [J2tFwx]
24,200  ╚═══════════════════════════════════╝ ← KEY Bullish FVG BTM 🟢 STRONG DEMAND
        │                                    │
24,187  ╔═══════════════════════════════════╗ ← Bearish FVG TOP [rguMQx]
24,150  ╚═══════════════════════════════════╝ ← Bearish FVG BTM  🔴 SUPPLY
        │                                    │
24,180  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← HVN Open [RxVgeU]
24,162  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← HVN Open bottom
        │                                    │
24,125  ╔═══════════════════════════════════╗ ← Opening Gap TOP [RT2HXD]
24,095  ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  ← HVN Bottom [se4yd5]
24,084  ╚═══════════════════════════════════╝ ← Opening Gap BTM  🔵 GAP
        │                                    │
24,070  ╔═══════════════════════════════════╗ ← Minor Bearish FVG TOP [TUxnxL]
24,063  ╚═══════════════════════════════════╝ ← Minor Bearish FVG BTM 🔴 SUPPLY
─────────────────────────────────────────────────────────────────
```

---

### FVG Zone Table

| Zone | Range | Type | Role | Entity ID | Status |
|---|---|---|---|---|---|
| Distribution High | 24,420–24,450 | Supply | Session high, sellers loaded | — | Resistance |
| Day High Resistance | 24,405 | S/R Line | Key resistance, wick rejection | H781dC | Active |
| Bullish FVG | 24,335–24,347 | Demand | SHORT trigger on break | JnUatQ | Broken → Resistance |
| VWAP (Apr 29) | 24,332 | Intraday | Bias line | — | Broken bearish |
| HVN / POC | 24,315 | Volume | High volume node | d0g7Y3 | Ref only |
| Bullish FVG | 24,285–24,303 | Demand | Next demand below | JMGBrh | Active |
| KEY Bullish FVG | 24,200–24,237 | Demand | Strong unfilled gap | J2tFwx | Active |
| Bearish FVG | 24,150–24,187 | Supply | Overhead supply zone | rguMQx | Active |
| HVN Open | 24,162–24,180 | Volume | High volume cluster | RxVgeU | Ref only |
| Opening Gap | 24,084–24,125 | Gap | Day open gap unfilled | RT2HXD | Active |
| HVN Bottom | 24,095 | Volume | Volume shelf | se4yd5 | Ref only |
| Minor Bearish FVG | 24,063–24,070 | Supply | Minor supply below | TUxnxL | Active |

---

### Apr 29 Orderflow Story

```
Phase 1 — RALLY (morning):
  23,855 (session low) → 24,405 (day high)
  Key bar: 216K vol absorption at session open low
  Price rallied ~550 pts from low

Phase 2 — DISTRIBUTION (24,420–24,450):
  8 bars stuck between 24,420–24,450
  Volume: 19K–54K, declining closes
  Classic institutional selling at highs

Phase 3 — BREAKDOWN (trigger):
  119K vol climax bar → closed at 24,410 (bearish absorption)
  86K vol bar → broke below 24,405 support
  96K vol bar → broke below 24,335 FVG + VWAP
  SHORT triggered: bar close 24,320, vol 115K

Phase 4 — SELL CONTINUATION:
  221K vol bar: O:24,344 → L:24,285 → C:24,292 (climax sell)
  164K vol bar: continued to 24,274
  Volume dry-up → consolidation ~24,286
```

---

### Trade Result (Apr 29 Short)

```
Entry:      24,320  (bar close below 24,330 + VWAP break, vol 115K)
Low seen:   24,274  (+46 pts)
Target 1:   24,250  (+70 pts)
Target 2:   24,200  (+120 pts)
Stop moved: 24,325  (breakeven+ after entry)
Outcome:    Partial exit recommended at 24,286 (+34 pts)
            Trail rest toward 24,250 / 24,200
```

---

### How to Redraw FVGs Next Session

```
1. data_get_ohlcv (count=100) → scan 3-candle pattern
   Bullish: bars[i+1].low > bars[i-1].high
   Bearish: bars[i+1].high < bars[i-1].low

2. draw_shape (rectangle) for each FVG:
   - time1/price1 = top-left corner (bar A close time, bar C high)
   - time2/price2 = bottom-right corner (extend 20 bars right, bar A high)
   - color: green (bullish), red (bearish), blue (gap)

3. draw_shape (horizontal_line) for HVN / POC / key S/R

4. Check which FVGs are still "unfilled" vs "broken"
   - Unfilled = price hasn't returned to the zone → still active
   - Broken = price closed through zone → flip role (demand→supply)
```

---

## Folder Structure

```
AI focus/
├── TradingView-Indicator/
│   ├── EMA33_VWAP_RSI_DI.pine       ← Pine Script source
│   └── INDICATOR_NOTES.md            ← Full indicator documentation
├── Tradenotes/
│   ├── TRADENOTES.md                 ← This file (trade reference + FVG map)
│   └── TRADE_IMPROVEMENT.md          ← Session learnings + live ruleset
└── README.md
```

> **Before every session:** Read `TRADE_IMPROVEMENT.md` → Current Best Practices section.
> **After every session:** Update session log above + add new learning to `TRADE_IMPROVEMENT.md`.
