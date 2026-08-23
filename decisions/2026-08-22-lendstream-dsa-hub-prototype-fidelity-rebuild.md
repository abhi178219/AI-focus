## Decision: Rebuild against the actual prototype source rather than a second-hand punch list; expand the domain model to the prototype's 13-section underwriting workbench, backed by real document extraction

## Context
After two rounds of "design match" work the user still reported "still not matching the original prototype, a lot of details are missing." Both prior rounds had been driven by a *punch list* (an Opus subagent's written findings) rather than by the prototype itself. Going back to the source found the gap was far larger than any punch list had captured.

The prototype lives at
`/Users/mac/Documents/Codex/2026-08-21/sites-plugin-sites-openai-bundled-x20/work/site/public/preview.html`
— a single self-contained 806KB React bundle. It can be inspected by copying it to a writable dir and serving it (`python3 -m http.server`); the original directory is sandbox-blocked for process spawning, but the file is readable.

## What the source comparison actually found
Measured directly off the running prototype (computed styles + bundle strings), not estimated:
- **Font is Onest**, not Plus Jakarta Sans (which is only its fallback).
- **Cards are `#f7f6f4`, not white.** Ink is `#16161a`, not `#1a1917`. Sunken `#e3e2de`, line `#dcdbd6`, brand accent `#2440e8`.
- **Five distinct band hues**, where the build had collapsed them to three: STRONG emerald `#1a7f5a`, GOOD **sky** `#1f6fb2`, MODERATE amber `#a06a10`, WEAK **orange** `#b8551f`, CRITICAL rose `#b3323f`.
- **Stage pills ARE colour-coded** and carry a one-line descriptor underneath — directly contradicting a comment previously written into `lib/types.ts` claiming they were deliberately flat/neutral. That comment was an assumption, never verified against the prototype.
- **Lead detail has 13 tabs** (Overview, Applicant, Banking, GST, Bureau, Financials, Business, Stock, Collateral, Decision, Offers, Documents, Activity) against the build's 6, plus a five-cell metric strip with score ring, Note / Banker summary / Submit to lender actions, and a File-journey rail with a stage stepper.
- Leads screen uses **dropdowns, not chips** (a previous round had converted these to chips — moving *away* from the prototype).

## Alternatives considered
- Keep iterating from punch lists / screenshots.
- Synthesise the missing richness the way the prototype does — it derives business vintage, GST turnover, stock, financials etc. pseudo-randomly from a thin lead record (`Amit Enterprises Pvt Ltd` is literally `firstName + " Enterprises Pvt Ltd"`).
- Build the sections but leave them unpopulated placeholders.

## Reasoning
- **Always diff against the artefact, not a description of it.** Every prior round used a proxy and every prior round missed most of the gap. Reading the prototype's own computed styles and bundle took one pass and surfaced more than two punch-list rounds had.
- The prototype's richness is *synthesised*, which collides head-on with the user's explicit "no dummy data" directive. The resolution the user themselves gave — "rest can be inputed by user or captured from forms, bank statements, ITR, valuation report, etc." — maps the prototype's sections almost one-to-one onto document types. So each analytical section is **derived from a real parsed document**, and when that document isn't on file the section says so and links to upload it, instead of rendering a plausible number.
  - BANKING ← bank statement · GST ← GST returns · BUREAU ← credit report · FINANCIALS ← financial statement/ITR · STOCK ← stock statement · COLLATERAL ← valuation report · BUSINESS ← user-entered entity profile.
- This keeps design parity *and* data honesty rather than trading one for the other.

## Trade-offs accepted
- The prototype shows per-lender **TAT** and marketing bullets ("Zero Prepayment Penalties", "Concession for Female Co-Applicants"), and a composite **FIT score** ring on offers. None have any backing data source, and there is no lender-attributes table to configure them from. These are deliberately **not** rendered — ranking uses genuinely computable EMI / sanction / commission instead. Adding a `lenders` table so the user can configure TAT and features is the honest way to close this, and is not yet built.
- Section band thresholds (e.g. GST turnover ≥ ₹5 Cr ⇒ STRONG) are my own reasonable cut-offs, not recovered from the prototype's minified scoring code. They are centralised in `lib/decision/sections.ts` and easy to retune once real policy is supplied.
- Empty files now show a lot of "—". That is correct and intended given no-dummy-data, but it does mean a brand-new lead looks sparse next to the prototype's fully-populated demo lead.
- `assessment_pillars` still uses BANKING/BUREAU/COLLATERAL/GST; the prototype's four pillars are GST/BUREAU/BUSINESS/COLLATERAL. The rules engine was left alone this pass — realigning it is outstanding.

## Follow-up pass (same day) — three gaps the user flagged
- **Unsecured BL calculator was entirely absent.** It is not a variant of the FOIR calculator: in the prototype it is a separate bolt-on module with its own four assessment bases (Average Banking, GST Turnover, Unaudited Financials, Audited Financials), each with its own formula, its own policy gate and its own cap. Ported verbatim into `lib/decision/unsecuredBl.ts` with every threshold exposed as an editable variable. Verified against the prototype's own arithmetic: ABB capacity ₹97,500 × 36 months × 80% − ₹14,55,000 obligations = ₹13,53,000, capped at ₹35 L.
- **Products was missing the lender-product catalogue.** The prototype has *two* concepts: a product **family** (policy: FOIR, LTV, required documents) and a **lender product** (a specific bank's offering: rate, max sanction, tenure, fee). Only the first existed. Added `lender_products` (migration 009) with catalogue + policy views and an ops-only add form. "N active lender options" and "Current lenders" are now real joins, and the indicative-rate band is derived from live lender pricing, falling back to the family's policy band when no lender is configured.
- **Lead section tabs were far too thin.** The prototype's Banking tab alone carries five hero figures, a month-by-month statement table, an account panel, an overdraft facility panel and a conduct read — where the build showed four small metrics. The section model now carries optional `hero` / `tables` / `panels` / `conduct`, the bank-statement extraction schema captures per-month rows and account/OD detail, and `SectionPanel` renders whatever the parsed document actually yielded.

Catalogue writes are ops-only at the RLS level; `addLenderProduct` checks the returned row count rather than just `error`, per the established rule, and a partner sees an explanatory message instead of a form.

## Supersedes
Extends [2026-08-22-lendstream-dsa-hub-documents-offers-redesign.md](2026-08-22-lendstream-dsa-hub-documents-offers-redesign.md) and corrects the "stage pills are deliberately neutral" claim recorded in [2026-08-22-lendstream-dsa-hub-design-match-and-copilot.md](2026-08-22-lendstream-dsa-hub-design-match-and-copilot.md).
