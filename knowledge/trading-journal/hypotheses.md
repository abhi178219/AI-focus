# Trading Journal App — Hypotheses (need more data)

## Trade entry method
- **Hypothesis:** Manual entry (plus screenshot-upload with vision-LLM extraction) is sufficient for MVP; CSV/broker auto-fetch import can be a fast-follow.
- **Needs:** Confirm manual + screenshot entry doesn't create too much friction for the target user's actual trade volume.

## Local LLM choice for deep-analysis (post-MVP migration)
- **Hypothesis:** A locally-hosted open model (e.g. Llama 3 or Qwen via Ollama) will be capable enough for trade-review analysis once the cloud-validated prompts are ported over.
- **Needs:** Decide hosting target (user's own machine vs. a dedicated server/VM) and which model, once MVP analysis quality is proven on Claude API. See [LLM phasing decision](../../decisions/2026-07-01-trading-journal-llm-phasing.md).
