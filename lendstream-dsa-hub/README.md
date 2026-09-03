# 🏦 LendStream DSA Hub

> A real, database-backed loan origination system (LOS) for DSA (Direct Selling Agent) partners and ops teams — lead capture through underwriting, decisioning, offers and disbursal, with a local AI pipeline that reads uploaded documents instead of asking users to re-key them.

Built as a working replica of a partner-portal prototype, then extended well past it: per-lead credit analysis (Banking, ITR, GST, Bureau, Financials, Business, Stock, Collateral), a deterministic rules engine for PASS/REFER/DECLINE, an applicant/company relationship layer, a Tasks and Policy workspace, and an AI copilot — all backed by real Postgres RLS, not mocked data.

## ✨ What's in here

- **Leads & applicants** — minimal-friction lead capture, a HubSpot-style Company/Key-Personnel model for business applicants, a searchable applicant directory, and an applicant-level **relationship layer**: portfolio snapshot (exposure, EMI, tenure, won/dropped/active), a consent centre, a document vault, lead-source attribution, and relationship activity kept separate from any one file.
- **Document intelligence** — upload a bank statement, ITR, GST return, salary slip, property valuation, credit report, or financial statement; a local Ollama model OCRs and extracts structured fields, which feed straight into the analysis tabs. Nothing is fabricated — a field the document didn't carry renders as "—".
- **Underwriting analysis** — Banking, ITR, GST, Bureau, Financials, Business, Stock and Collateral tabs, each reading real parsed documents, cross-checking them against each other (GST vs ITR vs bank credits, GSTR-1 vs GSTR-3B, etc.), and surfacing evidence-only red flags. Every tab gets an on-demand AI-generated summary.
- **Decisioning** — a deterministic rules engine (`lib/decision/rulesEngine.ts`) computes score, band and PASS/REFER/DECLINE from the parsed documents and product policy — the LLM only extracts, it never decides.
- **Activity** — per-application interaction logging split into Customer / Internal / Bank sub-tabs, each with its own channel set and outcome vocabulary.
- **Tasks & Policy** — a day/week/month task board taggable to any applicant or application, and a Live/All/Create credit-policy workspace (product-scoped, versioned, ops-gated for publishing).
- **Offers & CAM** — lender-product catalogue, offer comparison, and a bankable-summary export.
- **AI Copilot** — an in-app assistant with a fixed, auditable tool allowlist (stage moves, lead creation, CRM sync requests, notes, quote sharing) — it can never touch a verdict or a disbursed amount.

## 🧱 Stack

- **App:** Next.js 16 (App Router) + React 19 + Tailwind 4
- **Database:** Supabase Postgres, with Row-Level Security on every table (own-or-ops throughout — `dsa_partner` sees their own book, `ops_admin` sees all)
- **AI:** local Ollama (`gemma3:4b` for extraction/summaries, `hermes3:8b` for tool-calling) + `tesseract`/`poppler` for OCR — no data leaves the machine
- **Auth:** Supabase Auth, two roles (`dsa_partner`, `ops_admin`)

## 🚀 Getting started

```bash
cd lendstream-dsa-hub
npm install

cp .env.local.example .env.local
# Fill in SUPABASE_SERVICE_ROLE_KEY from the Supabase dashboard
# (Project Settings → API) — needed for scripts/seed.ts and ops actions.

# Local AI dependencies (macOS):
brew install ollama tesseract poppler
ollama pull gemma3:4b
ollama pull hermes3:8b
ollama serve &

npm run seed   # optional — creates demo partner/ops accounts and sample data
npm run dev    # http://localhost:5176
```

Demo credentials (after seeding) are printed by `npm run seed`.

## 📁 Structure

```
app/                  Next.js App Router — pages + server actions (app/actions)
components/shared/    Feature components (leads, applicants, policy, tasks, activity, …)
components/ui/        Design-system primitives (Card, Badge, …)
lib/decision/         Rules engine, credit-policy constants, per-section analysis logic
lib/ai/                Extraction prompts/schemas for the document pipeline
supabase/migrations/  Every schema change, applied in order
scripts/seed.ts       Demo data seeding
```

## 📚 Project history

Every non-obvious decision made while building this — and why — is logged under [`/decisions`](../decisions) (files prefixed `lendstream-dsa-hub-`) and summarised in [`/knowledge/lendstream-dsa-hub/knowledge.md`](../knowledge/lendstream-dsa-hub/knowledge.md).
