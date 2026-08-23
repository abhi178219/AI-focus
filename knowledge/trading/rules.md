# Trading Rules (Confirmed)

## NTC Trend v3 — Confirmed Optimal Parameters (Options Trading, NIFTY 5m)
*Backtest: NSE:NIFTY 5m, Jan 27 – May 6 2026, 105 trades, +3.79% net*

### Signal Parameters (apply by default)
| Parameter | Value | Reason |
|-----------|-------|--------|
| EMA Band Length | 33 | Confirmed working |
| RSI Bull Level | 52 | Confirmed working |
| RSI Bear Level | 48 | Confirmed working |
| DI Threshold | 20 | Confirmed working |
| ADX Minimum | **20** | 18 was too loose — raised to 20 |
| TP ATR Multiplier | **2.0x** | 1.5x gave 33.6% win rate; 2.0x gives 42.86% + positive P&L |
| SL ATR Multiplier | 1.0x | Keep as is |
| Max Signals/Day | **2** | 3rd signal of day is weakest — drop it |
| Min Hold Bars | 10 | 50 min on 5m, prevents premature reversals |
| Supertrend Gate | **OFF** | Enabling it eliminates too many valid signals |

### Options Entry Rules (confirmed via backtest)
- **Bias direction for PUTs > CALLs** in bearish/sideways market: PUT win rate 46% vs CALL 38%
- **Target slightly ITM options** (delta 0.6–0.7) to capture most of index move
- ATR on NIFTY 5m ≈ 36 pts → TP ≈ 72 pts, SL ≈ 36 pts on index

### Performance Benchmarks (reference)
| Metric | Value |
|--------|-------|
| Win rate | 42.86% |
| Profit factor | 1.457 |
| Sharpe ratio | 1.142 |
| Avg win per lot | ₹5,368 |
| Avg loss per lot | ₹2,763 |
| W/L ratio | 1.94:1 |
| Expected payoff/trade | ₹722/lot |
| Max drawdown | 1.72% |

## Backtesting Rules
- **Backtest NIFTY options strategies on NSE:NIFTY spot** (not futures) — futures contracts are too short-lived (<3 months) for meaningful backtests
- TradingView strategy `cash_per_order` commission type is broken — use `cash_per_contract` with value = (flat_commission / lot_size) = 20/75 = 0.267
- Set `initial_capital >= position_size` or TradingView silently rejects all entries. For 75-unit NIFTY lot at 24000: need ≥ ₹18L capital (use ₹20L)
- Strategy Tester API (`data_get_strategy_results`) only works for strategies added via Indicators button, not Pine Editor compilation

## NTC Scalp v2.1 — Session & Setup
- 15m timeframe: fewer but higher-quality signals (confirmed better than 5m for scalping)
- ATR-based TP/SL (1.5x/1.0x) outperforms fixed 27/20 pts
- News filter (5× volume spike) correctly pauses signals during event days
- Alternation lock prevents consecutive same-direction signals

## General NIFTY Options Rules
- Trade 1 lot minimum (75 units)
- Round-trip commission ≈ ₹40/trade (₹20/order at discount broker)
- ATM options have delta ≈ 0.5; slightly ITM have delta 0.6–0.7
- Exit at 50% premium loss (SL) regardless of index SL level
