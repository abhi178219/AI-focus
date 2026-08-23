## Decision: Use Google NotebookLM as an external, citation-grounded reference layer for domains where the repo's own knowledge base is thin — one NotebookLM notebook per domain, feeding curated external sources (books/PDFs/docs the user already has), with answers manually copied back into `/knowledge/<domain>/knowledge.md` tagged with their source.

## Context: Repo's `/knowledge/` folders (trading, trading-journal, job-scan) capture facts/hypotheses/rules derived from the user's own work, but some sections need deeper subject-matter grounding than the repo has generated on its own (e.g. options/order-flow theory, Pine Script v6 internals, PM/product frameworks) — trading and PM/product frameworks were the two domains identified as needing this.

## Alternatives considered:
- Ask Claude to answer from general knowledge — rejected, not grounded/citable, risk of confident-but-wrong domain claims.
- Build a custom RAG pipeline over the user's PDFs — rejected as overkill; no engineering task currently justifies the build cost.
- Paste raw source PDFs directly into repo `knowledge/` folders — rejected; repo folders are for distilled facts/rules, not raw reference material, and would bloat the repo with copyrighted third-party content.

## Reasoning: NotebookLM ingests a fixed source set per notebook and answers only from those sources with inline citations, which fits the "confirmed fact" bar the repo's knowledge.md/rules.md files require. No API exists, so integration is manual (open notebook, ask, copy grounded answer + citation into the relevant knowledge.md under an "External (NotebookLM)" heading) — acceptable given low query frequency expected.

## Trade-offs accepted: No automation between NotebookLM and this repo (manual copy-paste each time); NotebookLM's free tier caps sources per notebook (50) and won't retain across sessions unless the user maintains the notebook themselves.
