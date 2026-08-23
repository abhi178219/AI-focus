## Decision: Agentic, self-learning credit decisioning on local models — with the deterministic engine retained as a recorded reference

## Context
The user asked to make the LOS agentic and self-improving: a local model that learns from document extraction and from credit decisions, "with higher accuracy", plus additional skills.

This directly reverses the architecture chosen at the start of this build
([2026-08-22-lendstream-dsa-hub-architecture.md](2026-08-22-lendstream-dsa-hub-architecture.md)), where the LLM only extracted and a deterministic rules engine made the call, specifically so a lending decision would be reproducible and auditable.

## Alternatives considered
Presented to the user explicitly, with the trade-offs stated:
1. **Learning confined to extraction and analysis; verdicts stay deterministic.** Agent learns to read documents, calibrate confidence and draft narrative; it may *propose* policy changes for human approval. Decisions stay reproducible.
2. **Agent decides, rules engine as guardrail.** Model produces the verdict but cannot cross hard knockouts.
3. **Fully agentic decisions, self-learning on outcomes.**

## Reasoning
The user chose option 3, having been told in the same breath that it means non-reproducible decisions, weak auditability, and fair-lending / model-governance exposure for a regulated lender. That is their call to make — it is their product and their regulatory surface — and ML-driven underwriting is a normal, legal practice provided it is governed.

I did not silently substitute my preferred architecture. What I did add, because it costs nothing and does not dilute the agentic design:

- **Every agent run is recorded in full** (`agent_runs`): the input snapshot, each tool call and its result, the raw model output and the stated reasoning. A decision can be reconstructed after the fact.
- **The deterministic rules engine still runs alongside** and its verdict/score are stored on the same row (`reference_verdict`, `reference_score`). This gives a permanent divergence trail: if the agent and the rules disagree systematically, that is measurable rather than invisible.
- **The decision agent has no write tools at all.** `runAgent` filters any tool marked `mutates` unless the caller passes `allowMutations`, and the decision skill never does. The model cannot alter a lead, a document or policy.
- **Learned policy does not self-apply.** `learned_policies` rows start as `proposed` and only an ops admin can approve; the agent's `get_learned_policy` tool returns approved rows only. A learned rule therefore never silently changes how files are decided.
- **Tools run through the request-scoped Supabase client**, so RLS constrains the agent exactly as it constrains the signed-in user.

## Model selection — measured, not assumed
- **gemma4 cannot run here.** Its smallest published build is 12b (~8 GB quantised); this machine is an 8 GB M1. Recorded so it is not retried.
- **hermes3:3b was pulled, tested and rejected.** It does not emit native `tool_calls` — it emits malformed pseudo-JSON in the message content (`{" arguments ": " arguments , " name ": " get_lead "}`). Not fixable by prompting at that size.
- **qwen2.5:7b-instruct passed the same test cleanly** but was ruled out on the user's instruction not to use Chinese models.
- **hermes3:8b** (NousResearch, on Meta Llama 3.1) is the agent brain: purpose-built for function calling, non-Chinese, and what the user originally asked for.
- Extraction stays on **gemma3:4b**.

**Verify native tool-calling before adopting any replacement model.** Several models advertise the capability and do not actually emit it; the 3b failure above is exactly that.

## Trade-offs accepted
- **Non-reproducible verdicts.** The same file can be decided differently as learned context accumulates. `agent_runs` makes each individual decision explainable after the fact, but does not make the system deterministic.
- **Outcome learning inherits historical bias.** Learning from which files were sanctioned or defaulted encodes whatever bias existed in those past decisions. Nothing in this design detects that; it needs deliberate fairness testing that has not been built.
- **RAM contention.** hermes3:8b (~4.7 GB) and gemma3:4b (~3.3 GB) cannot both stay resident on 8 GB, so Ollama swaps between a decision run and an extraction run, costing a model load each way. Consolidating to one model or moving `OLLAMA_HOST` to a GPU box removes it.
- **Latency.** A single tool round-trip measured ~18 s on this M1; a multi-step decision is minutes, not seconds. This is a background job, not an interactive one.

## Supersedes
Reverses the LLM-extracts / rules-decide split in [2026-08-22-lendstream-dsa-hub-architecture.md](2026-08-22-lendstream-dsa-hub-architecture.md), while retaining that engine as a comparison reference rather than deleting it.
