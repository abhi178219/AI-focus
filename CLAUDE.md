Before starting a new task, review existing rules and hypotheses for this domain.
Apply rules by default. Check if any hypothesis can be tested with today's work.

At the end of each task, extract insights. Store them in domain folders, e.g.:
  /knowledge/pricing/         (or /onboarding/, /competitors/)
    knowledge.md  (facts and patterns)
    hypotheses.md (need more data)
    rules.md      (confirmed — apply by default)

Maintain a /knowledge/INDEX.md that routes to each domain folder.
Create the structure if it doesn't exist yet.
When a hypothesis gets confirmed 3+ times, promote it to a rule.
When a rule gets contradicted by new data, demote it back to hypothesis.

When about to make a decision that affects more than today's task,
first grep /decisions/ for prior decisions in that area.
Follow them unless new information invalidates the reasoning.

If no prior decision exists — or you're replacing one — log it:

File: /decisions/YYYY-MM-DD-{topic}.md

Format:
  ## Decision: {what you decided}
  ## Context: {why this came up}
  ## Alternatives considered: {what else was on the table}
  ## Reasoning: {why this option won}
  ## Trade-offs accepted: {what you gave up}
  ## Supersedes: {link to prior decision, if replacing}
