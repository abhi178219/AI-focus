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

---

## Folder Structure
```
AI focus/
├── TradingView-Indicator/
│   ├── EMA33_VWAP_RSI_DI.pine     ← Pine Script source
│   └── INDICATOR_NOTES.md          ← Full indicator documentation
├── Tradenotes/
│   └── TRADENOTES.md               ← This file (trade reference)
└── README.md
```
