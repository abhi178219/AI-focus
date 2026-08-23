## Decision: Build the new trading journal web app as a standalone product, separate from the existing Trading Brain dashboard

## Context: User wants to plan a trading journal web app for serious traders with integrated charting, before building a full model. An existing `TradingJournal.jsx` + `CandleChart.jsx` already exist inside `tradedesk_nifty_setup/` (Trading Brain dashboard, NIFTY-specific, AI-assisted trade entry). Needed to decide whether the new journal extends that component or is built fresh.

## Alternatives considered:
- **Extend existing TradingJournal.jsx/CandleChart.jsx** — faster start, reuses Supabase schema and charting setup already built for the NIFTY TradeDesk / Trading Brain project.
- **Separate standalone product** — new codebase, aimed at serious traders generally rather than tied to one NIFTY-specific AI dashboard.

## Reasoning: User chose standalone. Trading Brain is scoped to NIFTY options + AI-assisted entry decisions (ENTER/SKIP/WAIT verdicts); the journal app is a broader, more general-purpose product for trade review/analytics that shouldn't be coupled to that dashboard's data model or AI workflow.

## Trade-offs accepted: Gives up reuse of the existing Supabase schema, chart component, and Trading Brain infra. Existing code (CandleChart.jsx, TradingJournal.jsx) is reference/inspiration only, not shared implementation — some rebuilding of chart-with-trade-markers logic is expected.

## Supersedes: None (first decision in this domain)
