## Decision: Build LendStream DSA Hub as a new Next.js + Supabase app (`/lendstream-dsa-hub`) mirroring hospital-crm's conventions, with a local OCR + local-LLM (Ollama) document pipeline whose output feeds a deterministic, code-based eligibility rules engine — the LLM never decides the verdict itself

## Context: User was shown a running localhost:3000 app, "LendStream DSA Hub — RupeeBoss Partner Portal," and asked to replicate it as a real, database-backed app. Investigation found it was a pure static-HTML mockup (no backend, hardcoded data) from an unrelated tool, living outside this repo. User additionally wants an open-source AI pipeline that parses uploaded loan documents (PAN, Aadhaar, salary slips, bank statements, ITR, GST returns, property docs) and drives an eligibility/risk decision.

## Alternatives considered:
- Stack/location: new folder in this monorepo (Next.js + Supabase, hospital-crm's pattern) vs. a fresh repo vs. a different stack entirely.
- AI document parsing: local OCR (tesseract.js vs. system tesseract+poppler binaries) + local LLM via Ollama vs. a hosted open-source-model API (Groq/Together) vs. a cloud proprietary AI API.
- Decision computation: LLM produces the eligibility verdict directly vs. LLM only extracts structured data, with a separate deterministic rules engine computing score/verdict.
- Tenancy: multi-tenant (clinic_id-style) vs. flat single-organization RLS model.
- Ops account provisioning: self-service invite UI (hospital-crm's pattern) vs. seed-script-only for MVP.

## Reasoning:
- Reusing hospital-crm's exact conventions (folder layout, `@supabase/ssr` client split, `proxy.ts` role guard, numbered migrations applied via Supabase MCP, `scripts/seed.ts` pattern) avoids re-deriving decisions already made and validated in this repo, and keeps the monorepo consistent.
- Local OCR (system `tesseract`+`poppler` over `tesseract.js`) trades a one-time `brew install` for materially better accuracy/speed on financial documents where extraction correctness matters. Local LLM via Ollama (`qwen2.5:7b-instruct` first) keeps the whole pipeline free and private, matching the user's explicit "open source AI, deployed locally" ask.
- **The LLM only extracts; a plain code-based rules engine computes score/verdict.** Lending decisions must be auditable and reproducible — a knockout threshold has to trace to an explicit, testable check, not LLM reasoning that can vary run-to-run or hallucinate a number. This also mirrors how the original mockup itself was built (pure threshold/reduce logic, no AI in the decision path).
- Flat RLS model (no multi-tenant boundary): DSA Hub is one organization with many partner agents, not a multi-clinic platform, so hospital-crm's `clinic_id` scoping has no equivalent here — simpler two-role model (`dsa_partner` sees own leads only, `ops_admin` sees all) is sufficient and easier to audit.
- Seed-script-only ops provisioning: ops/underwriter headcount is small and fixed for an MVP; an invite UI is deferred rather than built speculatively.
- Applied the hospital-crm RLS hardening lesson (`2026-08-02-hospital-crm-rls-hardening.md`) from day one rather than retrofitting: `handle_new_user()` always assigns the lowest-privilege role regardless of client-supplied metadata; `profiles` role column is never client-writable (column-level `GRANT`/`REVOKE`); role elevation only via the service-role client.
- Had an independent Codex review of the initial RLS design before building further app code (same practice as hospital-crm's Opus review). It found three additional issues fixed in `004_harden_rls_execute.sql`: the `current_user_role()`/`is_ops_admin()` SECURITY DEFINER helpers were public-schema functions directly callable via PostgREST RPC by any signed-in (or anonymous) user (moved canonical versions to a non-exposed `private` schema, revoked EXECUTE on the public copies); `documents.uploaded_by` was spoofable on insert/update (now checked against `auth.uid()`); and the storage policies for the `lead-documents` bucket only validated the `agent_id` path segment, not that the `lead_id` segment was actually a lead that agent owned (a partner could otherwise write into another partner's lead folder) — fixed with an `EXISTS` check against `leads`.

## Trade-offs accepted:
- Full Aadhaar numbers are never extracted or stored, only last 4 digits — a deliberate privacy-by-default deviation from the mockup's raw-Aadhaar-number field. Revisit only if a real regulatory/underwriting need for the full number is identified.
- Document-processing pipeline runs synchronously inline in the upload flow for MVP (acceptable for local-dev, single-user use) — explicitly flagged as scaling debt, not hidden; will need a background job/queue before multi-user load.
- `extraction_confidence` on the `documents` table is a heuristic (schema-completeness ratio), not a calibrated model confidence score — must not be presented to users as if it were one.
- Composite score pillar weighting starts equal-weighted (configurable per product via `products.pillar_weights`) since the original mockup's exact weighting logic was in a minified bundle and not fully recoverable — will need real-world tuning once the rules engine is exercised against real cases.
- No multi-tenant boundary — if LendStream DSA Hub ever needs to serve multiple lending organizations rather than one, this will require a schema migration (adding an org/tenant scoping column and reworking RLS), similar to what hospital-crm already has.

## Supersedes: None — first decision for this domain.
