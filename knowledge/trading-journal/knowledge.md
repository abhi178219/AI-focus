# Trading Journal App — Knowledge

## Scope decisions (2026-07-04)
- **Instruments:** NIFTY/Indian markets only for v1 — see [decision](../../decisions/2026-07-04-trading-journal-scope-and-users.md)
- **Users:** Multi-user from the start — Supabase auth + row-level security on every table, not a single-user MVP
- **Auth:** Email + 4-digit PIN (sign-in, self-service sign-up, forgot-PIN reset) — mapped internally to satisfy Supabase's password length minimum. See [decision](../../decisions/2026-07-04-trading-journal-pin-auth.md) for the security trade-off accepted.

## Deployed backend (as of 2026-07-04)
- Supabase project in use: `uhymfejminshzofusitv` ("abhi178219's Project") — **this is a shared project also used by the `newsflow` app**, not a dedicated one as originally decided. No table-name conflicts were found (`trades`/`tags`/`trade_tags` are new), so this was accepted as-is rather than provisioning a separate project. Revisit if the two apps' data/security needs ever diverge.
- Migration `0001_init.sql` applied directly to this project via Supabase MCP.
- Repo pushed to [github.com/abhi178219/tradejournal](https://github.com/abhi178219/tradejournal) as its own standalone git repository (not part of the AI-focus monorepo).
- Supabase's built-in email sender (`noreply@mail.app.supabase.io`) has a very low rate limit — hit "email rate limit exceeded" after just 2 sends in one session. Not reliable beyond light testing; needs custom SMTP before real users depend on confirmation/reset emails.

## Dhan API charting (2026-07-04)
- Real candles now come from Dhan's `/charts/intraday` via a serverless proxy (`api/dhan-candles.js`) — Dhan blocks direct browser CORS and the access token must stay server-side, same reasoning as the Claude key.
- **Verified via Dhan's own docs + live scrip master CSV** (not assumed): intraday endpoint supports 90 days/request, up to 5 years total history; daily candles go back to a scrip's inception. So charting *old* trades is not actually a constraint — a trade's window is always small regardless of its age.
- **NIFTY 50 index securityId = 13** (`exchangeSegment: IDX_I`, `instrument: INDEX`) — confirmed directly from `https://images.dhan.co/api-data/api-scrip-master.csv` (`SEM_TRADING_SYMBOL=NIFTY`, `SEM_SEGMENT=I`), not from memory.
- Default chart is the NIFTY index (matches the trader's actual signal methodology — see `knowledge/trading/knowledge.md`), with an optional `trades.security_id` column (migration `0002_add_security_id.sql`) for charting the literal option/future contract instead. See [decision](../../decisions/2026-07-04-trading-journal-dhan-charting.md).
- `CandleChart.jsx` tries Dhan first, falls back to the synthetic placeholder (`candleData.js`) on any failure — verified both paths in the browser preview.
- Dhan's personal access token is stored server-side as a single shared credential for now (not per-user), per an earlier explicit call to keep auth simple while it's really just one person using the app.

## Screenshot storage (2026-07-04)
- Trade screenshots upload to the private `trade-screenshots` bucket at `{user_id}/{timestamp}-{filename}`, matching the RLS folder-ownership policy from the migration.
- `trades.screenshot_url` stores the object **path**, not a public URL (bucket is private) — display code calls `getScreenshotSignedUrl()` to mint a short-lived signed URL on demand. See `src/lib/storage.js` and `src/components/ScreenshotThumbnail.jsx`.
- Verified end-to-end against the live Supabase project (upload → signed URL → image actually rendered), via a SQL-created test account to work around the email rate limit above.

## Product framing (as of 2026-07-01 planning session)
- **Target user:** serious discretionary/retail traders, not beginners, not institutional
- **Core differentiator vs. Tradervue/Edgewonk/TraderSync:** journal entries are anchored to the actual chart (entry/exit/SL/TP plotted on candles at the right bar), not just a P&L row disconnected from context
- **Relationship to Trading Brain:** standalone product — see [decision](../../decisions/2026-07-01-trading-journal-standalone.md). Not sharing Supabase schema, chart component, or AI-entry workflow with `tradedesk_nifty_setup`.

## MVP scope agreed — 3 screens

### 1. Calendar Dashboard (home page)
- Month-view calendar; each day cell = P&L (color-coded), trade count, win %
- Summary strip for visible month (total P&L, total trades, overall win %)
- Click a day → drill-down with full trade list for that day (entries, exits, tags, notes, per-trade chart)
- Needs a day-level rollup (group trades by date → sum P&L, count, win%) — Postgres view or client-computed

### 2. Trade Input
- Manual entry form (instrument, side, qty, entry/exit price+time, SL/TP, P&L, tags, notes)
- Screenshot upload path: user uploads a picture → vision LLM extracts trade details → pre-fills form for confirm/edit
- "Grab trade details to analyze" = pulling from already-logged trades (manual or screenshot-assisted), NOT a separate import/broker-fetch mechanism — clarified 2026-07-01
- Every saved trade is one row in `trades`, feeding both the calendar and analysis screen

### 3. Deep Analysis Screen
- Filter by calendar date/date-range, or by instrument + date range
- LLM reviews entry/exit quality, adherence to tagged setups/rules, cross-trade patterns; produces detailed narrative on why trades passed/failed
- **LLM phasing decision:** cloud LLM (Claude API) for MVP now, self-hosted local LLM (Ollama etc.) later — see [decision](../../decisions/2026-07-01-trading-journal-llm-phasing.md). Analysis logic sits behind a swappable "analysis provider" interface to ease the future migration.
- Screenshot-upload OCR also uses the cloud LLM (same provider) for MVP consistency

## Cross-cutting features
- Per-trade candlestick chart with entry/exit markers (all screens link back to this)
- Tagging: setup/strategy, mistake, emotion/state
- Analytics: win rate, expectancy/R-multiple, equity curve, breakdown by tag
- Review workflow: weekly/monthly retro grouped by tag/pattern

## Explicitly out of scope for MVP
- Live broker sync / auto-execution import
- Real-time AI trade suggestions (that's Trading Brain's job)
- Multi-user/social features
- Real-time streaming quotes

## Reusable reference (not shared code)
- [CandleChart.jsx](../../tradedesk_nifty_setup/src/components/CandleChart.jsx) shows a working lightweight-charts v5 candlestick setup with EMA9/21/VWAP overlays — useful pattern reference for the new chart component
- [TradingJournal.jsx](../../tradedesk_nifty_setup/src/components/TradingJournal.jsx) shows a Supabase real-time trade table pattern

## Proposed stack
- Frontend: React + Vite + lightweight-charts (open-source, MIT — chosen over TradingView's Advanced Charts due to its "not for private use" licensing clause and approval-gated access; see [decision](../../decisions/2026-07-01-trading-journal-charting-library.md))
- Backend: Supabase (own project, Postgres + Auth + Storage)
- Hosting: Vercel (frontend) + Supabase (backend)
