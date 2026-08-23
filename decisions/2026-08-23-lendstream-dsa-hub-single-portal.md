## Decision: Collapse to a single agent portal and delete the ops portal

## Context
The app had grown two portals — `/partner` (DSA agent) and `/ops` (operations admin). The reference prototype has exactly one portal. The user asked to drop the second entirely: "Only single portal which is standard portal."

## Alternatives considered
- Keep `/ops` behind a feature flag.
- Keep `/ops` routes but hide the nav entries.
- Delete `/ops` and route both roles to the one portal.

## Reasoning
- The prototype is the fidelity target and has no second portal; keeping a second one guarantees permanent divergence and doubles the surface every future fidelity pass has to cover.
- `ops_admin` does not need a separate *UI* — the difference between the roles is **RLS read scope**, not screens. A partner sees only their own leads; an ops admin reads all of them. Both were already rendering the same shared components (`LeadDetail`, `LeadsTable`, `ProductsWorkspace`), so the second portal was mostly duplicated routing.
- Deleting routes is safer than hiding them: a hidden-but-live route is still reachable by URL.

## What changed
- Deleted `app/ops/**` (7 route files).
- `lib/supabase/middleware.ts` and `app/actions/auth.ts`: both roles now resolve to `/partner`; `PORTAL_PREFIXES` is a single entry. The existing cross-portal guard becomes a harmless no-op rather than dead code.
- `app/partner/layout.tsx`: accepts any authenticated profile instead of `role === 'dsa_partner'`. **This was load-bearing** — leaving the old check in place would have sent every `ops_admin` into a `/login` ↔ `/partner` redirect loop with no way in.
- `AppShell`: dropped the `variant` prop and the `ops` nav array; one nav list.
- `LeadsTable`: removed `showPartner`/`partnerName` (the prototype's table has no Partner column).
- Removed `/ops/*` `revalidatePath` calls from the lead, narrative, apply-fields and lender-product actions.

## Trade-offs accepted
- An `ops_admin` now sees all partners' leads in a table with **no column identifying whose lead is whose**, because the prototype's table has no such column. Fidelity won over that affordance. If ops ever needs attribution back, the honest fix is a column shown only to `ops_admin` — not a second portal.
- No privilege change: every RLS policy is untouched, including the ops-only write gate on `lender_products`. The catalogue form still degrades to an explanatory message for partners.
- The deleted routes were **never committed** — the whole `lendstream-dsa-hub/` tree is untracked — so they were copied to the session scratchpad before deletion rather than relying on git to recover them.

## Also corrected this pass (prototype fidelity)
Read from the prototype's own `ti` stage map rather than inferred:
- `STAGE_LABELS` restored to the short forms — `DOCUMENTATION: 'Documentation'` (not "Document collection") and `ASSESSMENT: 'Assessment'` (not "Underwriter review"). The longer wording belongs to the File-journey stepper only, and I had wrongly promoted it into the global label map, which changed the funnel and table text.
- `DROPPED: 'Dropped / Lost'`.
- `STAGE_PILL_STYLES`: QUALIFIED and DOCUMENTATION are the prototype's **brand** tone (indigo `#eef1fe`/`#2440e8`), not sky.
- Dashboard funnel is the prototype's condensed **six** milestone stages (`NEW, QUALIFIED, ASSESSMENT, LOGGED_IN, SANCTIONED, DISBURSED`) on a `lg:grid-cols-6` — Contacted and Documentation are working states, not funnel milestones.

## Supersedes
Extends [2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md](2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md).
