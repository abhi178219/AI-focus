# EMA33 + VWAP + RSI + DI — Indicator Notes
**Script:** `EMA33_VWAP_RSI_DI.pine`  
**Version:** Pine Script v6  
**Chart:** NSE:NIFTY (works on any NSE symbol)  
**Best Timeframe:** 5m / 15m (intraday scalping)

---

## What This Indicator Does

A confluence-based signal indicator that fires a **BUY** or **SELL** label only when ALL four conditions align simultaneously:

| Condition | BUY requires | SELL requires |
|---|---|---|
| EMA33 Band | Close ABOVE both EMA-High & EMA-Low | Close BELOW both |
| VWAP | Close > VWAP | Close < VWAP |
| RSI (14) | RSI > 55 | RSI < 45 |
| +DI / -DI | +DI > 25 | -DI > 25 |

Signals are **alternating** — once a BUY fires, the next signal must be a SELL (no repeat stacking). Resets fresh every day.

---

## Components Explained

### 1. EMA33 Band
- Two EMAs calculated on `high` and `low` separately (not close)
- Creates a "band" rather than a single line — price must be cleanly above/below the entire band
- **Band Mode options:**
  - `Close Based` (default) — close must be above both EMA-High and EMA-Low
  - `Full Candle Based` — stricter: entire candle (low/high) must be outside band
- Green line = EMA of highs, Red line = EMA of lows, Blue fill between them

### 2. VWAP (Volume Weighted Average Price)
- Calculated on `HLC3` = (High + Low + Close) / 3
- Resets daily (standard VWAP behaviour)
- Orange line on chart
- Acts as intraday bias filter — only take longs above VWAP, shorts below

### 3. RSI (14)
- Standard 14-period RSI
- Bull threshold: 55 (momentum confirming upside)
- Bear threshold: 45 (momentum confirming downside)
- The 55/45 band avoids trading in neutral chop zone (45–55)

### 4. DMI — Directional Movement Index
- Uses +DI and -DI (ADX removed intentionally)
- Threshold: 25 — only trade when directional strength is present
- For BUY: +DI > 25 confirms bulls are in control
- For SELL: -DI > 25 confirms bears are in control

---

## Live Table (Top-Right)

Shows real-time data for **NIFTY, BANKNIFTY + 10 constituent stocks:**

| Column | Meaning |
|---|---|
| Symbol | Stock/index name |
| LTP | Last traded price (green = above prev close, red = below) |
| Contrib | NIFTY contribution in points from that stock |
| VWAP | Above / Below / At VWAP |
| RSI | Current RSI value |
| +DI | Positive Directional Index |
| -DI | Negative Directional Index |
| Trend | BULL / BEAR / NEUTRAL based on all 4 conditions |
| Change | Change from previous day close (pts) |

**Contribution formula:**
```
Contrib (pts) = NIFTY_LTP × Stock_Weight × ((Stock_LTP - PrevClose) / PrevClose)
```
The NIFTY row shows the **SUM** of all selected stock contributions — tells you how many points the top 10 stocks are collectively adding or subtracting from NIFTY.

### Stock Weightages (default — editable in settings):
| Stock | Weight |
|---|---|
| HDFCBANK | 12.30% |
| ICICIBANK | 8.38% |
| RELIANCE | 8.16% |
| INFY | 4.98% |
| BHARTIARTL | 4.75% |
| LT | 4.00% |
| SBIN | 3.87% |
| AXISBANK | 3.40% |
| TCS | 2.76% |
| ITC | 2.69% |

---

## Session Filter
- Default: **ON** — only processes signals between **9:15 AM – 3:30 PM IST**
- Can be turned off for testing on non-NSE symbols or historical analysis

---

## Signal Logic (Step by Step)
```
1. Is market in session? (9:15–15:30)
2. Is price above EMA band? → aboveBand
3. Is price above VWAP? → close > vwapVal
4. Is RSI bullish? → rsiVal > 55
5. Is +DI strong? → pdi > 25
6. All 4 true? → rawBuy = true
7. Was last signal NOT a buy? → buySignal fires
8. Label "BUY" plotted below bar in green
```
Same logic inverted for SELL.

---

## Scalping Tips Using This Indicator

1. **Switch to 5m or 15m** — VWAP and session filter are intraday tools
2. **Check the table first** — if majority stocks show BULL trend, bias long
3. **Contrib column** — if NIFTY row shows +ve contribution, bulls are driving index
4. **Wait for signal label** — don't anticipate, let all 4 conditions confirm
5. **Use S/R levels alongside** — combine with the drawn S/R levels for entry precision
6. **Risk management** — use a 15–20 pt stop on NIFTY futures/options for scalps

---

## Files in This Folder
- `EMA33_VWAP_RSI_DI.pine` — full Pine Script source code
- `INDICATOR_NOTES.md` — this file (full documentation)

---

## MCP Setup Reference
- Repo: `~/tradingview-mcp-jackson`
- MCP config: `~/.claude.json` (tradingview server)
- Node path: `/Users/mac/.nvm/versions/node/v24.15.0/bin/node`
- Chrome CDP: launch with `--remote-debugging-port=9222 --user-data-dir=/tmp/chrome-cdp-profile`
