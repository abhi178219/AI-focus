## Decision: Tasks are a dedicated table with two independent, optional foreign keys (`applicant_id`, `lead_id`) rather than a polymorphic/generic link

## Context
The `/partner/tasks` sidebar icon was added earlier the same day (2026-09-01) as an honest placeholder. The user then asked for the real feature: grid and list views, pending/completed broken down day-wise/week-wise/month-wise, priority notifications, and the ability to add a task against an application or an applicant.

## Alternatives considered
1. **Generic polymorphic link** (`taskable_type` + `taskable_id`, no FK constraint) — maximally extensible to future entity types, but throws away referential integrity and `on delete cascade`, and every other relation in this codebase (key_personnel, lender_products, assessments) uses named, constrained FKs. Would be the odd one out.
2. **Single `lead_id` only** (tasks always belong to an application) — simplest, but doesn't match the request: a task like "call to discuss becoming a client" can exist before any application does, and a Company Applicant with no applications yet (see [2026-08-31-lendstream-dsa-hub-company-key-personnel.md](2026-08-31-lendstream-dsa-hub-company-key-personnel.md)) would have nowhere to hang a task.
3. **Two independent, optional FKs (`applicant_id`, `lead_id`), both nullable** — chosen. A task can be general (neither set), about a person (`applicant_id` only), or about one specific application (`lead_id`, with `applicant_id` auto-derived server-side if the caller only picked a lead). Matches how every other record in this app already relates to Applicant vs. Lead.

## Reasoning
Option 3 won because it mirrors the existing Applicant/Application relationship exactly (an Applicant is the person; a Lead is one specific loan application under them — see the Applicant→Application decision), needs no new abstraction, keeps real FK constraints and cascade-delete, and directly satisfies "add tasks against that application/applicant" as two independent, honest choices in the New Task form rather than one overloaded picker.

## Trade-offs accepted
- If a future entity type needs tasks (e.g. a Lender or a Product), this table gains a third nullable FK column rather than being generic from day one — acceptable now, revisit only if that need materializes.
- Day/week/month grouping and the priority-notification banner run in plain server-side JS over the fetched rows (see `lib/dates.ts`), not a DB-side window function — fine at this data volume (single DSA's own tasks), would need to move server-side (indexed date-range queries with pagination) well before this becomes a bottleneck.
- No recurring-task, reminder-email, or push-notification machinery — "priority notifications" here means a real computed on-page banner (overdue + high-priority-pending counts), not an out-of-band alert. Scoped to what was asked; flagged here so it isn't assumed to exist.

## Supersedes
Extends (does not replace) the 2026-09-01 "Tasks and Policy nav icons" placeholder — that entry's `/partner/tasks` page is now the real feature described here.
