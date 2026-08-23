## Decision: Use lightweight-charts (open-source) for the trading journal app's charting, not TradingView's Advanced Charts / Charting Library

## Context: User pointed to TradingView's Charting Library docs (https://www.tradingview.com/charting-library-docs/latest/introduction) as a possible charting solution for the new standalone trading journal app. Investigated licensing: TradingView's free "Advanced Charts" tier requires TradingView attribution AND the implementation to be public — explicitly "not for private use or behind a paywall" — plus requires applying for approval before even downloading the library (not on npm). The paid "Trading Platform" tier is a separate commercial arrangement. Separately, TradingView also publishes "lightweight-charts", a fully open-source (MIT) library with no attribution/approval/usage restrictions — already in use in the existing `CandleChart.jsx` (tradedesk_nifty_setup, a different/unrelated Trading Brain project).

## Alternatives considered:
- **Advanced Charts (free tier of the full Charting Library)** — much richer feature set (100+ indicators, 110+ drawing tools) but gated behind an approval application, and the "not for private use" clause creates real licensing ambiguity for a personal/authenticated trade journal.
- **TradingView Trading Platform (paid)** — not evaluated in depth; commercial licensing overhead not justified for MVP.
- **lightweight-charts (open source)** — no approval process, no attribution, no usage restriction; sufficient for the journal's actual chart needs (candlesticks + entry/exit/SL/TP markers), though lacks a built-in indicator/drawing-tool suite.

## Reasoning: The journal's chart requirement for MVP is "plot a trade's entry/exit against candles for review," not a full technical-analysis platform. lightweight-charts covers that with zero licensing risk or approval lead time, and the team already has working integration experience with it from the Trading Brain project's CandleChart.jsx.

## Trade-offs accepted: No built-in 100+ indicator library or advanced drawing-tool suite out of the box — any additional overlays/indicators (EMA, VWAP, etc.) must be computed and drawn manually, as already done in CandleChart.jsx. Revisit if the product later needs full charting-platform depth (at which point re-examine Advanced Charts licensing terms directly with TradingView, or the paid Trading Platform).

## Supersedes: None
