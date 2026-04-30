# Trade Improvement Plan — NIFTY Scalping

> Running log of session learnings, mistakes, and process improvements.
> Updated after every session. Each entry builds on the previous.
> Reference alongside TRADENOTES.md before every trade.

---

## How to Use This File

1. **Before each session** — read the latest improvement plan section
2. **After each session** — add a new entry with date, what worked, what didn't, and the updated rule
3. **Each learning supersedes the previous version** of that rule — see "Current Best Practices" at the bottom for the live ruleset

---

## Session Log

---

### Session 1 — Apr 29, 2026 | SHORT Trade

**Symbol:** NSE:NIFTYK2026 | **Timeframe:** 5m
**Bias:** Short | **Entry:** 24,320 | **Exit:** 24,274 (partial) | **Result:** +46 pts

#### What Happened
- Identified distribution zone at 24,420–24,450 (8 bars, declining closes)
- Climax sell bar: 119K volume at 24,410 confirmed institutional selling
- SHORT triggered when bar closed below 24,330 (FVG bottom + VWAP break) with 115K vol
- Price sold off 3 consecutive bars (119K → 86K → 96K vol) to 24,274
- Partial exit at 24,286 (+34 pts). Target 1 was 24,250, Target 2 was 24,200

#### What Worked ✅
- Distribution pattern correctly identified before breakdown
- Volume confirmation (115K = 2.7x avg) validated the entry
- Consecutive high-volume bearish bars = held short correctly
- Stop moved to breakeven after entry — zero risk trade

#### What Didn't Work ❌
- Exited too early — T1 (24,250) and T2 (24,200) both achievable but not captured
- No pre-defined partial exit plan — decision made reactively under pressure
- Did not account for time of day — late session shorts carry overnight gap risk

#### Learnings
| # | Learning | Rule Added |
|---|---|---|
| L1 | High-vol climax bar (3-5x avg) at key level = high-probability reversal signal | Always mark climax bars. Entry on next bar confirmation. |
| L2 | Distribution zone = 3+ bars in tight range at highs with above-avg vol | Pre-mark distribution zone before breakdown, not after |
| L3 | Exiting too early when trade in profit | Set T1/T2 BEFORE entry. Do not change mid-trade. |
| L4 | No partial exit plan | Rule: exit 50% at T1, trail rest with stop at entry |

---

### Session 2 — Apr 30, 2026 | LONG Trade

**Symbol:** NSE:NIFTYK2026 | **Timeframe:** 5m
**Bias:** Long | **Entry:** 23,980 | **Exit:** ~24,010–24,018 (two halves) | **Result:** ~+30 pts total
**Max available from entry:** +45 pts (high 24,025) | **Max available from optimal entry:** +170 pts

#### Full Trade Timeline
```
09:15  Opening bar — 604K vol gap-down. Day sell-off begins.
       O:24,063 → L:23,988 → C:23,995

09:15–09:40  Continued sell-off with 418K, 248K, 151K volume bars.
             Price finds area: 23,930–23,940

09:40–10:10  Price continues lower to 23,855 session low.
             KEY BAR: 216K vol absorption candle at 23,855.
             This was the REAL demand signal. Missed.

10:10–11:00  Accumulation shelf: 23,851–23,920 for ~40 mins, 10+ bars.
             Volume dried up to 12K–50K. Classic compression.

11:00        Breakout begins. Trigger bar: C:23,980, vol:53K above EMA High.
             ENTRY: 23,980 ← entered here (breakout trigger)

11:05        T1 hit: +10 pts at 23,990. Exited half.

11:05–11:20  Consolidation: 23,960–23,990. Volume dry-up: 33K→19K→15K.
             BB Upper expanding: 23,979 → 23,997 → 24,009 → 24,028.

11:20        Compression burst bar: 65K vol to 24,008. Closed 23,995.

11:20–11:30  Price pushed to 24,012, pulled back to 23,968, recovered.

11:30        Second half exited ~24,010–24,018.

11:35        T2 reached: 24,025.9 (AFTER exit)
```

#### What Worked ✅
- Accumulation shelf correctly identified (10+ bars, low volume)
- BB compression + volume dry-up signal called correctly before burst bar
- Stop placement (23,955–23,960) never threatened — correct structural stop
- Monitoring loop (90s) caught the trigger at the right time
- FVG zones drawn provided clear reference map for the whole session

#### What Didn't Work ❌

**1. Entry was 125 pts late**
- The 216K vol absorption bar at 23,855 was the real demand signal
- Waited for breakout at 23,980 instead of entering at the VWAP pullback (23,944–23,955)
- Left 125+ pts of the move on the table before entry

**2. T1 target too small (+10 pts)**
- T1 should have been BB Upper at entry (~24,009) = +29 pts, not a fixed 10 pts
- Exiting 50% at 23,990 (+10) was too conservative
- The move had 45 pts available from entry

**3. No plan for psychological round number (24,000)**
- Price stalled at 24,000 for 3 bars — caused indecision
- No pre-defined rule for how to handle round numbers
- Should have planned "at 24,000 = hold, look for 2-bar confirmation before exiting"

**4. Final half exited before T2**
- T2 at 24,020 was hit after exit (24,025.9 high)
- Exited on a minor pullback to 23,968 scare instead of trusting the structure

#### Learnings
| # | Learning | Rule Added |
|---|---|---|
| L5 | 216K vol absorption bar at session low = primary entry signal, not a precursor | When vol > 3x avg at new low AND bar closes in upper 40% = DEMAND. Mark it. Enter on next VWAP touch. |
| L6 | T1 must be set dynamically to BB Upper at entry, not fixed pts | T1 = BB Upper value at time of entry. T2 = next FVG or 2x stop. Never use fixed pt targets. |
| L7 | Volume compression (3+ bars <40% avg vol) = breakout imminent | When 3 consecutive bars have vol <40% avg AND price above VWAP → set breakout alert immediately |
| L8 | Round numbers need a pre-defined plan | Rule: At any round number (24,000 / 24,100 etc.) → hold if 2 bars close ABOVE it. If 1 bar wicks and rejects → exit 30%, trail rest. |
| L9 | Opening bar volume sets the day's context | Opening bar vol: <2x avg = normal day. 2-5x avg = volatile. >5x avg = gap/event day. Adjust targets accordingly. |
| L10 | Breakout entry (Trigger A) is the backup, not primary | Primary = VWAP pullback entry (Trigger B) inside accumulation zone. Breakout entry = only if Trigger B is missed. |

---

## Current Best Practices (Live Ruleset)

> This section is updated after every session. Use this as the checklist before every trade.

---

### 🔍 Pre-Session Checklist

```
□ Read opening bar volume — classify day type (normal / volatile / gap day)
□ Mark session high/low from previous day
□ Check yesterday's FVG zones — are they still active?
□ Identify nearest psychological round numbers
□ Set VWAP as bias line — long only above, short only below
□ Check BB band width — wide = trending, narrow = compression incoming
```

---

### 📦 Entry Rules

**PRIMARY — Trigger B (Demand Absorption)**
```
Condition 1:  Single bar with vol > 3x average at new session low
Condition 2:  Bar closes in upper 40% of its range (absorption, not distribution)
Condition 3:  Price holds above that bar's low on next 1-2 bars
Entry:        Long on pullback to VWAP after absorption
Stop:         Below absorption bar low
Why better:   Lower entry = wider stop = bigger reward. Best R:R.
```

**SECONDARY — Trigger A (Breakout)**
```
Condition 1:  Price consolidates above VWAP + EMA High for 3+ bars
Condition 2:  Volume dries up to <40% of avg for 3+ bars (compression)
Condition 3:  Breakout bar closes above EMA High + BB Upper with vol > avg
Entry:        On breakout bar close
Stop:         Below EMA Low / VWAP
Why secondary: Higher entry, lower R:R — use only if Trigger B missed
```

---

### 🎯 Target Rules

```
T1:   BB Upper value at TIME of entry (dynamic — check study values)
T2:   Next FVG resistance above OR 2x stop distance from entry
T3:   Trail with EMA Low as stop (only after T2 hit)

Exit sizing:
  At T1:               Exit 40% of position
  At round number:     Hold if 2 bars close above. Exit 20% if wick rejection.
  At T2:               Exit another 40%
  Trailing 20%:        Stop = EMA Low. Exit on structure break only.
```

---

### 🛑 Stop Rules

```
Primary stop:   Below EMA Low + VWAP cluster (structural)
Max stop:       25–30 pts on NIFTY futures (never wider)
Move to BE:     After first 15 pts of profit
Trail:          Move stop to previous bar's low after T1 hit
Never:          Exit manually before stop without a signal (emotional exit)
```

---

### 📊 Volume Rules

```
Opening bar >5x avg:   Gap day — wait for sell-off to find demand, then long
Single bar >3x avg:    Climax / absorption — mark as key level
Volume dry-up 3 bars:  Compression — breakout alert ready
Rising vol on up bars: Trend continuation — hold
Rising vol on down bar in uptrend: Warning — tighten stop
```

---

### ⚠️ Round Number Rules

```
On approach to round number (X,000 / X,500):
  - Do NOT exit in advance of it
  - Watch how price behaves AT the level
  - 2 bars close above → hold, it's breaking out
  - Wick rejection + close below → exit 30%, trail rest
  - Never set T1 at a round number — set it at BB Upper or FVG instead
```

---

### 🔁 Post-Session Routine

```
1. Record trade in TRADENOTES.md session log
2. Identify 1-2 specific mistakes (not general — exact bars and prices)
3. Add learning to this file with rule
4. Update "Current Best Practices" section above
5. Check if any FVG zones were filled — update FVG map in TRADENOTES.md
```

---

## Learning Index

| ID | Learning | Session | Rule |
|---|---|---|---|
| L1 | Climax bar = reversal signal | Apr 29 | Mark 3-5x vol bars at key levels. Enter on next bar. |
| L2 | Distribution = pre-breakdown signal | Apr 29 | 3+ bars tight range at highs with high vol = sellers loading |
| L3 | Don't exit early when in profit | Apr 29 | Set T1/T2 before entry. No mid-trade changes. |
| L4 | Partial exit plan required | Apr 29 | 50% at T1, trail rest with stop at entry |
| L5 | Absorption bar = primary entry | Apr 30 | Vol >3x avg at low, close upper 40% = demand. Enter at VWAP. |
| L6 | Dynamic targets only | Apr 30 | T1 = BB Upper at entry time. T2 = 2x stop or next FVG. |
| L7 | Volume compression = breakout signal | Apr 30 | 3 bars <40% avg vol above VWAP → set breakout alert |
| L8 | Plan for round numbers | Apr 30 | Hold through round numbers if 2 bars close above |
| L9 | Opening bar classifies the day | Apr 30 | >5x avg = gap day. Adjust strategy accordingly. |
| L10 | Breakout entry is backup only | Apr 30 | Primary = VWAP pullback. Breakout = only if missed. |

---

## Metrics Tracker

| Session | Gross Pts | Max Available | Capture % | Stop Hit | R:R Achieved | R:R Possible |
|---|---|---|---|---|---|---|
| Apr 29 SHORT | +46 | +120 | 38% | No | 1.5:1 | 4:1 |
| Apr 30 LONG | +30 | +45 | 67% | No | 1.5:1 | 2.3:1 |
| **Average** | **+38** | **+82** | **46%** | **0/2** | **1.5:1** | **3.2:1** |

> **Goal:** Push capture % above 70% and R:R above 2:1 consistently.

---
