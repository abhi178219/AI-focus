# Indicator Notes — TradingView Custom Indicators

---

## 1. EMA33 + VWAP + RSI + DI
**File:** `EMA33_VWAP_RSI_DI.pine`
**Version:** Pine Script v6
**Best TF:** 5m / 15m (intraday scalping, NSE session filter built-in)

### Logic
Fires BUY/SELL only when ALL four conditions align simultaneously:

| Condition | BUY | SELL |
|---|---|---|
| EMA33 Band | Close ABOVE both EMA-High & EMA-Low | Close BELOW both |
| VWAP | Close > VWAP | Close < VWAP |
| RSI (14) | RSI > 55 | RSI < 45 |
| +DI / -DI | +DI > 25 | -DI > 25 |

Signals are **alternating** (no repeat stacks). Resets daily.

### Components
- **EMA33 Band** — EMA of high and low separately. Green = EMA highs, Red = EMA lows, Blue fill.
- **VWAP (HLC3)** — Daily reset. Orange line. Long only above, short only below.
- **RSI (14)** — Bull threshold 55, Bear threshold 45. Avoids chop zone 45–55.
- **DMI** — +DI / -DI only (ADX removed). Threshold 25.

### Live Table
Shows real-time data for NIFTY, BANKNIFTY + 10 constituent stocks:
`Symbol | LTP | Contrib | VWAP | RSI | +DI | -DI | Trend | Change`

### Stock Weightages (default)
| Stock | Weight | Stock | Weight |
|---|---|---|---|
| HDFCBANK | 12.30% | LT | 4.00% |
| ICICIBANK | 8.38% | SBIN | 3.87% |
| RELIANCE | 8.16% | AXISBANK | 3.40% |
| INFY | 4.98% | TCS | 2.76% |
| BHARTIARTL | 4.75% | ITC | 2.69% |

### Session Filter
Default ON — signals only between 09:15–15:30 IST.

### Signal Logic (Step by Step)
```
1. Is market in session? (09:15–15:30)
2. Is price above EMA band? → aboveBand
3. Is price above VWAP? → close > vwapVal
4. Is RSI bullish? → rsiVal > 55
5. Is +DI strong? → pdi > 25
6. All 4 true? → rawBuy = true
7. Was last signal NOT a buy? → buySignal fires
8. Label "BUY" plotted below bar in green
```

### Scalping Tips
1. Switch to 5m or 15m — VWAP and session filter are intraday tools
2. Check the table first — if majority stocks show BULL trend, bias long
3. Contrib column — if NIFTY row shows +ve contribution, bulls are driving index
4. Wait for signal label — don't anticipate, let all 4 conditions confirm
5. Use S/R levels alongside — combine with drawn S/R levels for entry precision
6. Risk management — use a 15–20 pt stop on NIFTY futures/options for scalps

---

## 2. ProfitScout
**File:** `ProfitScout.pine`
**Version:** Pine Script v6
**Best TF:** 5m (intraday scalping)
**Reverse-engineered from:** User screenshots, Apr 30 2026

### What It Does
Combines Supertrend trend direction with an EMA band zone and ATR-based TP ladder. Fires 5 signal types and tracks an active trade with a live info table — matching the "ProfitScout | TS: 2.8" indicator seen on chart.

### Core Settings
| Parameter | Default | Description |
|---|---|---|
| ATR Period | 14 | ATR length for Supertrend + TP calculation |
| Trail Stop Mult (TS) | **2.8** | Supertrend ATR multiplier — shown in table header |
| EMA Length | 20 | Length for EMA High/Low band |
| TP Step | 1.0x ATR | Each TP level = Entry ± N x ATR x this |
| Number of TPs | 6 | TP1 through TP6 shown on chart right edge |
| RSI Min for BC | 50 | BC signal requires RSI above this |

### Signal Types

| Signal | Label | Condition |
|---|---|---|
| Buy Confirmed | **BC** | Supertrend flips bullish + above VWAP + RSI > 50 |
| Buy | **BUY** | Supertrend flips bullish (partial confirmation) |
| Long Entry | **LE** | Pullback to EMA Low in bull trend + above VWAP |
| Sell | **SELL** | Supertrend flips bearish |
| Short | **S** | Price crosses below EMA High in bear trend + below VWAP |

**Signal hierarchy (strongest to weakest):**
```
BC   → Full confluence long (trend flip + VWAP + RSI)
BUY  → Trend flip only
LE   → Pullback continuation long
SELL → Primary short (trend flip)
S    → Short continuation on EMA rejection
```

### TP Calculation
```
ATR is captured at entry and fixed for that trade.

LONG:  TP(n) = Entry + n x ATR x TP Step
SHORT: TP(n) = Entry - n x ATR x TP Step

Example (ATR=15, TP Step=1.0x, Entry=24,136):
  TP1 = 24,151  (+15 pts)   ← book 40% here
  TP2 = 24,166  (+30 pts)
  TP3 = 24,181  (+45 pts)
  TP4 = 24,196  (+60 pts)
  TP5 = 24,211  (+75 pts)
  TP6 = 24,226  (+90 pts)   ← trail rest to here
```

### Trailing Stop
- = Live Supertrend value (moves dynamically with price)
- Shown in table as "Trail SL"
- Cell turns RED if price drops to/below trail SL = exit signal

### Info Table (bottom-right)
```
┌──────────────────────────┬──────────────┐
│ ProfitScout | TS: 2.8    │   ▲ LONG     │
├──────────────────────────┼──────────────┤
│ Entry Price              │   24136.00   │
│ Trail SL                 │   24068.18   │
│ Net Points               │   4.9        │
│ Next Target              │ TP1 @ 24151  │
└──────────────────────────┴──────────────┘
```

### Visual Elements
| Element | Description |
|---|---|
| Green background | Supertrend bullish |
| Red background | Supertrend bearish |
| Green Supertrend line | Dynamic support when bullish |
| Red Supertrend line | Dynamic resistance when bearish |
| Shaded band (green/red) | EMA High–Low zone, changes colour with trend |
| MID dots | EMA(close) mid-band line |
| Orange line | VWAP (daily reset) |
| TP1–TP6 labels | Right edge — teal = pending, grey = already hit |

### How to Use
```
1. Wait for BC or BUY signal (Supertrend flip to bullish)
2. Confirm price above VWAP and above EMA band
3. Set hard stop at Trail SL value in table
4. Book 40% at TP1, trail rest with stop at entry
5. Use LE signal for re-entry on pullback during trend
6. Exit all longs on SELL signal
7. Use S signal for short continuation entries in downtrend
```

### Tuning Guide
| Goal | Adjustment |
|---|---|
| Fewer, stronger signals | Increase TS to 3.0–3.5 |
| More sensitive signals | Decrease TS to 2.0–2.5 |
| Tighter TP spacing | Decrease TP Step to 0.5 |
| Wider TP spacing | Increase TP Step to 1.5–2.0 |
| Stricter BC signal | Increase RSI Min for BC to 55 |

---

## Files in This Folder

| File | Description |
|---|---|
| `EMA33_VWAP_RSI_DI.pine` | Original custom indicator — confluence signals with multi-stock table |
| `ProfitScout.pine` | Supertrend + EMA band + ATR TP ladder — reverse-engineered |
| `INDICATOR_NOTES.md` | This file — full documentation for both indicators |
