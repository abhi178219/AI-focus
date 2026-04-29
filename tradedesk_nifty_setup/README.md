# Nifty TradeDesk — Setup Guide

A single-file React trading dashboard for **Nifty 50 options** built on the **Dhan API v2**, with live candlestick charting and **Claude AI** analysis running every 90 seconds.

---

## What's Inside

`nifty-desk.jsx` is a self-contained React component (~816 lines) that gives you a **4-panel trading workstation**:

| Panel | Purpose |
|---|---|
| **1 · Chart** | 1-min candlestick chart (last 70 bars) with VWAP overlay, volume, and position levels (Entry / SL / T1 / T2) plotted directly on the chart |
| **2 · Order Entry** | Option selector (expiry, strike, CE/PE), BUY/SELL, Market/Limit, lot size — places orders via Dhan API |
| **3 · Orders** | Live view of active, pending, and closed orders with one-click cancel |
| **4 · Claude Analysis** | Auto-runs every 90s — sends your position + 90-sec OHLC bars to Claude Sonnet and returns a structured Hold vs Exit recommendation with action tag |

---

## Architecture Overview

```
nifty-desk.jsx
│
├── Constants & config
│   ├── DHAN = "https://api.dhan.co/v2"   ← Dhan API base
│   ├── LOT  = 65                          ← Nifty lot size
│   └── Colour palette (dark terminal theme)
│
├── API helpers
│   ├── dhanReq()   → all Dhan API calls (GET/POST/DELETE)
│   └── callClaude() → direct Anthropic API call (no backend needed)
│
├── UI Components
│   ├── CandlestickChart   (SVG — renders candles, VWAP, volume, levels)
│   ├── ChartPanel         (wraps chart + position strip inputs)
│   ├── OrderPanel         (option selector + order form)
│   ├── OrdersPanel        (order book table with tabs)
│   ├── AnalysisPanel      (Claude output + history log)
│   ├── SettingsModal      (credential entry on first load)
│   ├── ActionBanner       (Claude-suggested action with confirm button)
│   └── Toasts             (non-blocking notifications)
│
└── TradingDashboard (main)
    ├── State: creds, candles, LTP, position, orders, analysis
    ├── Polling: LTP every 5s via /marketfeed/ltp
    ├── Auto-refresh: chart + orders + Claude every 90s
    └── Order flow: place → confirm banner → Dhan /orders POST
```

---

## Prerequisites

- **Node 18+** with a React project (Vite / CRA / Next.js)
- **Dhan trading account** with API access enabled
- **Anthropic API key** (Claude Sonnet access)

---

## Setup

### 1. Install dependencies

```bash
npm install react react-dom
```

> No other packages needed — charting is pure SVG, no charting library required.

### 2. Drop the file into your project

```
src/
└── components/
    └── nifty-desk.jsx   ← place here (or any path you prefer)
```

### 3. Import and render

```jsx
// App.jsx or any entry point
import TradingDashboard from "./components/nifty-desk";

export default function App() {
  return <TradingDashboard />;
}
```

### 4. Configure CORS proxy (for Dhan API)

The component calls Dhan API directly from the browser. In production you'll need a **CORS proxy or backend relay** since Dhan API does not allow browser-origin requests.

For local dev with Vite, add to `vite.config.js`:

```js
server: {
  proxy: {
    "/dhan": {
      target: "https://api.dhan.co/v2",
      changeOrigin: true,
      rewrite: path => path.replace(/^\/dhan/, ""),
    },
  },
},
```

Then change the `DHAN` constant at the top of `nifty-desk.jsx` to `"/dhan"`.

### 5. Configure Anthropic API key

The `callClaude()` function calls `https://api.anthropic.com/v1/messages` directly. For a secure setup, route this through a backend endpoint and update the fetch URL in `callClaude()`.

For a quick local test you can inject the key via a Vite env variable:

```js
// in nifty-desk.jsx — callClaude()
headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
  "anthropic-version": "2023-06-01",
},
```

```bash
# .env.local
VITE_ANTHROPIC_KEY=sk-ant-...
```

---

## First Run

1. Launch the app — a **DHAN CONNECT** modal appears automatically.
2. Enter your **Client ID** and **Access Token** from the Dhan portal (My Profile → API Access).
3. Click **CONNECT** — the dashboard goes live.
4. In **Panel 1**, fill in the Security ID of your option and set Entry / SL / T1 / T2.
5. Claude analysis fires automatically every 90s once an entry price is set.

> **Note:** Credentials are stored in memory only and cleared on page refresh — nothing is persisted to disk or localStorage.

---

## Key Constants to Customise

| Constant | Location | Default | Change if… |
|---|---|---|---|
| `LOT` | Line 5 | `65` | Nifty lot size changes |
| `DHAN` | Line 4 | Dhan v2 URL | You use a proxy |
| `"1"` (interval) | `fetchChart()` | 1-min bars | You want 3m/5m candles |
| `90` (countdown) | `useState(90)` | 90 seconds | You want faster/slower Claude polls |
| `claude-sonnet-4-20250514` | `callClaude()` | Sonnet | Swap model as needed |

---

## Security Notes

- Never commit your Dhan access token or Anthropic API key to version control.
- In production, proxy both API calls through a server-side endpoint.
- The Dhan token expires — re-enter via Settings (⚙) when it does.
