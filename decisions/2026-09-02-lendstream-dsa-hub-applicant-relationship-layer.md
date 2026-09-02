## Decision: Add a relationship layer to the Applicant page as four new `applicant_id`-scoped tables, kept structurally separate from the existing `lead_id`-scoped documents/interactions — and resolve three ambiguous metrics (active exposure, existing EMI, won/lost/dropped) with explicit, documented rules rather than leaving them to guesswork

## Context
The user supplied a partial product-requirements excerpt (items 2, 3, 4, 5, 6, 8 — 1 and 7 not included) describing facts a single-application view structurally can't show: a portfolio snapshot across every application an applicant has ever made, entity-level consent (ahead of DPDP's Consent Manager framework going live mid-November 2026), an applicant-level document vault, lead-source attribution, a stage chip on the existing application list, and relationship-level activity kept separate from the per-file Activity tab.

Three of the six items required resolving a genuine ambiguity the spec didn't fully pin down before any code could be written.

## Alternatives considered
1. **Bolt everything onto `leads`/`documents`/`interactions` with a nullable `applicant_id` fallback** — rejected. A PAN card or a bureau-pull consent would either need re-uploading per application (defeating the point) or would live oddly on whichever lead happened to be open when it was captured, with every other application blind to it.
2. **Sum `existing_emis` across every application for "total existing EMI obligation"** — the literal reading of "sum across products" in the request. Rejected: `existing_emis` is the applicant's self-declared *external* obligation at the time of one specific application, re-entered per file. Summing three files' declarations of the same external car loan counts it three times. Resolved instead as: the figure from the single most recent application only, labelled explicitly as not summed and why.
3. **Invent a "Lost" stage distinct from "Dropped"** — the request asked for Won/Lost/Dropped counts, but this app's `LeadStage` enum has no terminal declined stage separate from `DROPPED`. Backfilling a "Lost" bucket from, say, the latest assessment verdict would conflate "the rules engine said DECLINE at some point" with "this application is closed and lost," which aren't the same fact. Resolved instead as Won/Dropped/**Active**, with the card stating outright that this app doesn't track a distinct "lost" stage.
4. **Fabricate a repayment/DPD summary from disbursed-loan amount and tenure** — rejected outright. This app captures loan origination, not loan servicing; there is no payment-history data anywhere in the schema. The snapshot renders one honest "not available" line instead of a plausible-looking number.

## Reasoning
Four new tables (`applicant_consents`, `applicant_documents`, `applicant_interactions`, plus two attribution columns on `applicants` itself) keep every relationship-level fact scoped to the person, not the file, which is the entire point of the request — and each is a genuinely different write pattern from its lead-scoped cousin: consent is compliance-grade and must never be overwritten (append-only, latest-row-wins-for-display), the vault is stored-and-listed with no extraction pipeline (unlike `documents`, which feeds AI parsing), and relationship activity carries no Customer/Internal/Bank split (that split, added earlier the same week, is specific to working one loan file). Reusing `documents`/`interactions` with a nullable `lead_id` would have blurred all three of those distinctions into one table trying to be three things.

The three ambiguity resolutions above were made explicit in the UI copy itself (a sub-line on the card, not just a code comment) precisely so a future reader doesn't mistake a deliberate simplification for a bug and "fix" it into something wrong — e.g. re-summing existing EMI across applications, which would silently start double-counting external debt in every DSCR-adjacent read of this page.

## Trade-offs accepted
- Existing EMI obligation reflects only the most recent application's declaration. If a customer's external obligations materially changed between applications and no new application has been logged since, the figure is stale until the next file is opened — a known limitation, not a bug.
- The "Active" bucket in lifetime applications conflates "genuinely still moving" with "the rules engine declined it but nobody marked the stage Dropped yet." Distinguishing those would need a real terminal-declined stage added to `LeadStage`, which is out of scope here.
- No repayment/DPD data exists in this app at all — the snapshot's honesty about that is itself the deliverable for this item, not a placeholder for a future fix within this change.
- Consent, document-vault, and relationship-activity tables all lack update/delete policies (append-only, matching `public.documents`'s existing precedent) — correcting a mis-entered note or consent channel means adding a new row, not editing the old one.

## Supersedes
None.
