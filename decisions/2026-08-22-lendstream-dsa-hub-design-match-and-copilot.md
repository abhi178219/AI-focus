## Decision: Rebuilt the visual design system to match the reference mockup's actual computed styles (not an earlier guess), and added the three deferred features (Offers/comparison, CAM export, AI Copilot chat) — with the Copilot's action-execution design reviewed by Codex before implementation

## Context: The first build pass (see [2026-08-22-lendstream-dsa-hub-architecture.md](2026-08-22-lendstream-dsa-hub-architecture.md)) inferred the mockup's visual style from a text-only exploration-agent summary, which guessed an indigo/blue brand color (`#3d55ec`) and a top-nav layout. User asked to "ensure the designs are same" as the prototype and to build the three previously-deferred features (Offers tab/comparison, CAM PDF, AI Copilot), using Codex where useful.

## Alternatives considered:
- Re-deriving the design from the text summary again vs. opening the live mockup in the browser and sampling actual computed CSS (`getComputedStyle`) via `javascript_tool`.
- AI Copilot: freeform chat directly executing database mutations vs. a fixed tool-allowlist with mandatory user confirmation before any write.
- Copilot execution privilege: run confirmed actions through a service-role (RLS-bypassing) client vs. the normal per-user RLS-scoped client.
- CAM export: add a PDF-generation library (e.g. `@react-pdf/renderer`) vs. a print-styled page using the browser's native print-to-PDF.

## Reasoning:
- Sampling the mockup's live computed styles caught real, otherwise-invisible mistakes: the actual brand color is near-black (`#1a1917`) on pill buttons, not indigo; the layout is a 64px icon-rail sidebar, not a top nav; lead *stage* pills are uniformly neutral-gray (only assessment *verdicts* are color-coded); the font is Onest/Plus Jakarta Sans, not Inter. A text summary from an earlier exploration pass was good enough for information architecture but insufficient for pixel-level fidelity — direct inspection was necessary once "match the design" became the explicit bar.
- Consulted Codex specifically on the Copilot's action-safety design before writing any code, since an LLM that can mutate loan records is the highest-risk new surface in this app. Codex's recommendation (fixed tool allowlist, mandatory confirm-before-execute UI card, hard-blocked financial fields, RLS-scoped execution not service-role) matched the project's existing security posture and was implemented as given — see `lib/copilot/schema.ts`, `lib/copilot/prompt.ts`, `app/actions/copilot.ts`.
- CAM export via the browser's native print (rather than a new PDF dependency) keeps the dependency footprint minimal and reuses the same server-rendered React/Tailwind styling already in place, at the cost of the user needing to click "Print → Save as PDF" rather than getting a direct file download.

## Trade-offs accepted:
- Not every tab/feature in the richer reference mockup was replicated 1:1 (e.g. per-pillar tabs like a separate "Stock" or "Business" tab, a "Banker summary" export, live typeahead search) — only features backed by real data in this app's schema were built. Fabricating UI for data that doesn't exist would violate the "no half-finished implementations" principle more than a deliberately smaller, fully-functional tab set does.
- `qwen2.5:7b-instruct` on this Mac's CPU is slow (60–120+ seconds per Copilot turn or case-narrative generation) — acceptable for a local-dev demo but a real latency constraint flagged in `knowledge.md`; a faster/smaller model or GPU-backed hosting would be needed before this is comfortable for daily use.
- Font substitution: used Plus Jakarta Sans instead of the mockup's primary "Onest" (not available in `next/font/google`) — the mockup's own font-stack already lists Plus Jakarta Sans as its fallback, so this is a faithful substitution, not a compromise.

## Supersedes: Amends (does not replace) 2026-08-22-lendstream-dsa-hub-architecture.md — the schema, RLS, and rules-engine decisions there are unchanged; this decision only concerns the presentation layer and the three new features layered on top of that foundation.
