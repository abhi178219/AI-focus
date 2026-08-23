# Trading Knowledge

## NTC Trend v3 1.1 — Indicator Overview
- **Purpose:** Trend-following signals for NIFTY 5m options trading
- **Core logic:** EMA33 band + VWAP + RSI + DMI/ADX confluence
- **Signal type:** B (buy CE) / S (buy PE) labels on chart with TP/SL values
- **Session:** 9:30–15:00 IST

## NTC Scalp v2.1 — Indicator Overview
- **Purpose:** Mean-reversion scalp signals (BB pierce + RSI + Stoch + ADX<20)
- **Best timeframe:** 15m (confirmed over 5m)
- **Improvements added in v2.1:** ATR TP/SL, news filter, alternation lock, configurable session

## Backtest Findings (May 2026)

### NTC Trend v3 on NSE:NIFTY 5m (Jan 27 – May 6, 2026)
- **Baseline (v1.0):** 125 trades, -0.82% net — commission-killed at 1 unit
- **Improved (v2.4):** 105 trades, **+3.79% net**, Sharpe 1.142
- Key improvement: TP 2.0x ATR + ADX≥20 + max 2 signals/day + correct lot-size commission

### NIFTY Market Regime (Jan–May 2026)
- NIFTY declined ~3.34% over this period (buy-and-hold negative)
- Bearish/sideways regime: SHORT signals more reliable than LONG
- Short win rate: 46.43% vs Long win rate: 38.78% in this period

## TradingView Pine Script Notes
- `strategy.commission.cash_per_order` is broken (causes 0 trades) — use `cash_per_contract`
- For flat commission on lot-based trading: `commission_value = flat_amount / lot_size`
- Strategy Tester needs `initial_capital >= qty × price` to enter positions
- NSE futures contracts (< 3 months old) can't be backtested via Strategy Tester
- `barstate.isconfirmed` in strategy mode: always true for historical bars
