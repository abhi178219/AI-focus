# Knowledge Index

| Domain | Folder | Contents |
|--------|--------|----------|
| NIFTY Options Trading | [/knowledge/trading/](trading/) | NTC indicator parameters, backtest results, Pine Script quirks, options entry rules |
| PM Job Scan (Hyderabad) | [/knowledge/job-scan/](job-scan/) | Recurring companies, experience-band patterns, resume gaps, expired roles, hypotheses, confirmed rules (rules.md) |
| Trading Journal App | [/knowledge/trading-journal/](trading-journal/) | Standalone journal+charting product scope, MVP feature set, open hypotheses on instrument scope/user model/entry method |
| Hospital/Clinic CRM | [/knowledge/hospital-crm/](hospital-crm/) | Single-clinic pilot wedge, chronic-care (diabetes/BP) records + vitals + prescription loop, safety constraints on prescription capture, open hypotheses on doctor entry UX and patient adherence |
| LendStream DSA Hub | [/knowledge/lendstream-dsa-hub/](lendstream-dsa-hub/) | Loan-partner portal + local OCR/Ollama document-parsing pipeline feeding a deterministic eligibility rules engine; RLS-hardening rules confirmed via live testing; open hypotheses on scoring weights and OCR model choice |

## External reference layer (NotebookLM)

For sections needing deeper subject-matter knowledge than this repo has generated on its own, use a dedicated NotebookLM notebook per domain (see [/decisions/2026-07-17-notebooklm-external-knowledge-source.md](../decisions/2026-07-17-notebooklm-external-knowledge-source.md)):

- **Trading / Pine Script** — theory, order flow, risk frameworks, Pine Script v6 reference
- **PM / product frameworks** — pricing, market sizing, discovery frameworks

NotebookLM has no API, so this is manual: open the relevant notebook, ask the question, and copy the grounded answer (with its source citation) into that domain's `knowledge.md` under an `## External (NotebookLM)` heading — don't paste raw source PDFs into the repo.
