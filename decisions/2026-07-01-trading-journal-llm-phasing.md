## Decision: Use a cloud LLM (Claude API) for the deep-analysis and screenshot-OCR features in MVP, with a planned migration to a self-hosted local LLM later

## Context: Trading journal app's deep-analysis screen needs to scrutinize trades (by date or instrument) and explain why they passed/failed. User's long-term intent is a local LLM (privacy + cost at scale). Also needed a vision model for the screenshot-upload trade-entry path.

## Alternatives considered:
- **Local LLM from day one** (e.g. Ollama + Llama/Qwen) — matches the end-state goal immediately, avoids ever sending trade data to a cloud API, but adds hosting/inference infra complexity before the analysis prompts/approach are even validated.
- **Cloud LLM now, local later** — validate what "good analysis" looks like (prompts, context needed: tags, rules, chart data) using a capable cloud model first, then port to local once the approach works.

## Reasoning: User chose cloud-now/local-later. Faster to iterate on analysis quality without also debugging local inference setup at the same time. Local LLM migration is deferred but intentional — analysis logic will sit behind a swappable "analysis provider" interface so the eventual swap doesn't require rewriting the feature.

## Trade-offs accepted: Trade data goes to a cloud API in the interim (privacy trade-off, acceptable to user for now). Some rework expected when migrating prompts/context-formatting to whatever local model is chosen (model capability differences).

## Supersedes: None
