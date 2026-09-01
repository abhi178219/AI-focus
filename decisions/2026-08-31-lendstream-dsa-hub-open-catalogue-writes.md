## Decision: Opened lender-product catalogue writes (the "Add a new product" form on the Products tab) to every signed-in user, at both the RLS and UI level — reversing the earlier ops-only restriction.

## Context
User reported "Add a new product is static, it should be a button which allows users to create a new product which is present in prototype." Checked the actual prototype (`preview.html`) directly: its Products → "All available products" view shows the add-product form (Product family/name/Lender/rate/max sanction/tenure/fee, submit "Add product") as directly usable — no role gate visible anywhere in the prototype's UI or copy.

The live app's current behavior traced back to a deliberate, already-logged decision: [2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md](2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md)'s follow-up pass states "Catalogue writes are ops-only at the RLS level" — a `dsa_partner` viewing the tab saw a static explanatory message ("Only ops admins can add lender products...") instead of the form. This was intentional: lender rates/sanction limits/fees feed every partner's calculators and offer ranking, so one partner writing bad data would affect everyone.

This is a direct conflict between a prior deliberate decision and the current explicit request to match the prototype, so per project convention (check prior decisions, follow them unless new information invalidates the reasoning, log the replacement) this was put to the user directly with `AskUserQuestion` rather than silently picking a side:
- Keep ops-only, but fix the UI/UX around the restriction (recommended).
- Open it to everyone, matching the prototype exactly.
- Just fix the button/form presentation, no access change.

User chose: **open it to everyone, like the prototype.**

## Alternatives considered
- Keeping the ops-only gate and only improving the partner-facing message/UI — rejected, user explicitly wants partners to be able to add products themselves.
- Partially opening (e.g., allow insert but keep update/deactivate ops-only) — rejected as an inconsistent half-measure not actually requested; the prototype shows no such split, and the user's choice was to match it fully.

## Reasoning
- `lender_products write` RLS policy (`supabase/migrations/009_lender_products.sql`) changed from `using (private.is_ops_admin())` to `using (true) with check (true)` for any `authenticated` user — migration `019_lender_products_open_write.sql`.
- `AddLenderProductForm` no longer takes a `canEdit` prop or renders the ops-only explanatory message; the form is now always shown.
- `ProductsWorkspace` no longer fetches the viewer's `profiles.role` for this purpose (nothing else in that component used it).
- `addLenderProduct`/`toggleLenderProduct` still check the returned row count rather than trusting the absence of `error` (per the project's standing RLS-row-count rule) — now defensive against any *future* RLS tightening rather than today's ops-only gate specifically.
- Verified live: logged in as a `dsa_partner` demo account (`agent1@rupeeboss.demo`), successfully added and then removed a test lender product from the Products → All available products tab.

## Trade-offs accepted
- Any signed-in partner can now write shared pricing/lender data (rate, max sanction, tenure, fee) that every other partner's calculators and offer ranking read from. There is no review/approval step and no per-row ownership — a mistaken or bad-faith entry from any partner is immediately live for the whole team. The `created_by` column on `lender_products` still records who added each row, so a bad entry is at least attributable after the fact, but nothing currently surfaces that attribution in the UI or blocks the write beforehand.
- The `products` table (product family policy — FOIR/LTV/required-documents bands for PL/HL/LAP/BL/WC) is unchanged and still ops-only (`products_write_ops`); there is no UI to create a new product family at all today regardless of role — this decision only opened the lender-specific catalogue (`lender_products`), which is what the "Add a new product" form on this tab actually writes to.

## Supersedes
Reverses the "Catalogue writes are ops-only at the RLS level" trade-off recorded in [2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md](2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md)'s follow-up pass.
