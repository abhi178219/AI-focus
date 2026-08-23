## Decision: v1 of the trading journal app targets NIFTY/Indian-market instruments only, and is built multi-user from the start (Supabase auth + row-level security)

## Context: Two hypotheses from the initial planning session ([knowledge/trading-journal/hypotheses.md](../knowledge/trading-journal/hypotheses.md)) needed resolving before starting the build: instrument scope, and single-user vs. multi-user.

## Alternatives considered:
- **Instrument scope:** NIFTY/Indian markets only (simpler instrument model, matches existing trading setup) vs. multi-market/multi-asset (generic symbol field, more flexible schema).
- **User model:** Single-user personal tool (simplest auth, fastest to build) vs. multi-user from the start (Supabase auth + RLS per user, more setup now but avoids a later migration).

## Reasoning: User chose NIFTY-only for v1 (matches actual current trading activity, avoids premature generalization of the instrument/data model) and multi-user from the start (avoids a costly retrofit of auth/RLS later if others end up using it).

## Trade-offs accepted: Instrument field/schema will need rework if/when multi-market support is added later. Multi-user setup (Supabase auth + RLS policies on every table) adds upfront complexity vs. a single-user MVP, in exchange for not needing a data-model migration later.

## Supersedes: None — resolves the two open hypotheses from the initial planning session.
