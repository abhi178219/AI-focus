## Decision: Chart every trade against the NIFTY 50 index by default (via Dhan API), with an optional per-trade securityId for the literal contract's own chart

## Context: Charts were using synthetic placeholder OHLC data. User asked whether Dhan API could supply real futures/options chart data. Researched Dhan's actual `/charts/intraday` and `/charts/historical` endpoints (docs + live scrip master CSV) to verify feasibility before building.

## Alternatives considered:
- **Chart the literal option/future contract** — most literally accurate to the trade itself, but requires a `securityId` per contract looked up from Dhan's scrip master CSV (no symbol-search available), same manual-lookup burden the old `tradedesk_nifty_setup/nifty-desk.jsx` already required.
- **Chart the NIFTY 50 index by default** (chosen) — matches the trader's documented signal methodology (`knowledge/trading/knowledge.md`: NTC Trend/Scalp signals are generated off the NSE:NIFTY spot index, not the option premium). NIFTY's securityId (13) is fixed and verified directly against Dhan's own scrip master CSV, so zero per-trade setup is needed.
- **Both** (chosen as the actual implementation) — index by default for zero-friction charting on every trade, with an optional `security_id` field per trade for when the literal contract chart is wanted.

## Reasoning: Research corrected an earlier assumption — Dhan's intraday endpoint supports up to 90 days per request and up to 5 years of total history, and daily candles go back to a scrip's inception, so "can't chart old trades" is not actually a constraint (a single trade's chart window is always small regardless of how long ago it happened). The real constraint was CORS (Dhan blocks browser-origin calls) and the securityId-per-contract lookup, both resolved by defaulting to the fixed-ID index and proxying through a Vercel serverless function (`/api/dhan-candles.js`), matching the existing pattern for the Claude-backed functions.

## Trade-offs accepted: The default chart shows index price action, not the actual option/future premium the trade was taken in — accurate to the trader's decision-making process, but not a literal representation of the instrument's own P&L curve unless the optional securityId is filled in per trade. Dhan's access token is stored server-side as a single shared credential (per the earlier "store my token server-side for now" decision), not per-user, even though the app's auth is multi-user.

## Supersedes: None
