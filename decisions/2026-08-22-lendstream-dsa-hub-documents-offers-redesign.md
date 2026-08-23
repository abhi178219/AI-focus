## Decision: Redesign Documents tab and Offers tab to match the mockup using only real backing data; extend ops-portal parity

## Context
Completing the remaining items from Opus's design-fidelity punch list: Documents tab (category chips, drag-drop, camera capture, "N of M verified" checklist) and Offers tab (auto-ranked lenders vs. manual-only form), plus ops-portal parity for the stage picker / document checklist / offer ranking (ops shares the `LeadDetail` component with partner, so most of this came for free) and a genuine "Pass rate by partner" breakdown on ops analytics.

## Alternatives considered
- Fabricating a TAT (turnaround time) figure and a composite "FIT score" ring for the Offers tab, matching the mockup's visual more literally.
- Adding decorative header buttons ("Note", "Banker summary", "Submit to lender") that don't map to new capability.

## Reasoning
- TAT and FIT-score have no backing data source anywhere in the schema (no lender-SLA table, no scoring model beyond EMI/commission) — inventing numbers to fill a ring widget would violate the explicit "no dummy data" directive. Ranking by lowest indicative EMI (already the pattern used in `FoirCalculator`) is the one signal that's genuinely computable from `commission_slabs`, so the Offers tab reuses that same math and labels the winner "Best fit" rather than claiming a fabricated composite score.
- The document checklist ("N of M verified") is computed from the real `products.required_documents` for the lead's loan-type category, intersected with actually-verified `documents` rows — not a hardcoded checklist.
- Header shortcut buttons were skipped because equivalent real functionality already exists elsewhere (Interactions tab for notes, AI case-narrative card for banker summary, stage picker + Offers tab for submit-to-lender); adding duplicate decorative buttons with no new capability behind them would be exactly the kind of half-finished feature the user asked to avoid.
- Ops's `/ops/leads/[leadId]` route already renders the shared `LeadDetail` component, so the stage picker, document checklist, and offer auto-ranking apply to ops automatically with no extra work — verified directly in the browser logged in as an ops account.
- "Pass rate by partner" was deliberately left off the partner-scoped Dashboard earlier (RLS scopes a partner to their own leads, so a multi-partner breakdown there would be meaningless) but is genuine and valuable on the ops analytics page, since ops sees all partners — added there instead, joined against real `profiles` names.

## Trade-offs accepted
- The Offers tab's auto-ranked list can show the same bank twice when multiple `commission_slabs` rows exist for that bank/category (different slab tiers) — this is real configured data, not a bug, but could look like a duplicate at a glance; not deduped further since collapsing them would hide a genuine rate/commission distinction.
- Drag-and-drop file upload wiring (`DataTransfer` trick to populate the file input) was implemented and typechecked but not exercised end-to-end via actual OS file-picker automation, since the browser automation tool used for verification can't drive a native file dialog.

## Supersedes
None — extends [2026-08-22-lendstream-dsa-hub-design-match-and-copilot.md](2026-08-22-lendstream-dsa-hub-design-match-and-copilot.md).
