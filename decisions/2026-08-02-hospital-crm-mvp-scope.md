## Decision: MVP is a single-clinic pilot (via clinics/doctors the founder already knows), centered on a records + prescription + vitals-trend loop flavored for chronic-care physicians (diabetes/hypertension), not a generic multi-specialty clinic CRM

## Context: Brainstorming session to scope a healthcare CRM (hospital + individual doctor booking, prescriptions, medicine adherence tracking, inventory, records, diagnostics, insurance, surgery/post-care) before any build starts. Needed to pick a wedge instead of building all of it — see [knowledge/hospital-crm/knowledge.md](../knowledge/hospital-crm/knowledge.md).

## Alternatives considered:
- **Wedge**: booking/front-desk replacement vs. adherence/vitals loop vs. records/EMR backbone — considered building all three as v1.
- **Positioning**: industry-agnostic clinic CRM vs. chronic-care (diabetes/BP)-flavored physician tool.
- **Vitals entry**: staff-entered-at-visit only (v1) with patient self-logging deferred to v2, vs. building both from day one.
- **Prescription capture**: OCR auto-digitize handwritten scripts vs. doctor types the structured prescription in-app, with the handwritten photo kept only as a reference attachment.
- **Tenancy**: multi-tenant hospital platform from day one vs. single-clinic pilot first.

## Reasoning:
- Booking is commodity (many existing apps do it fine); the vitals-trend + adherence loop is the differentiated, sticky part, with records digitization as the necessary spine underneath it.
- Chronic-care framing (diabetes/hypertension trend management for physicians) gives v1 a sharp, marketable identity instead of "generic clinic software nobody gets excited about" — underlying data model stays generic so it can widen to other specialties/hospitals later.
- Vitals: staff-entry and patient self-logging are the same underlying primitive (reading + type + timestamp + source), so supporting both from day one is cheap. Patient adoption/habit-formation for self-logging is treated as a separate, later growth problem — not a gate on the build.
- Prescriptions: a misread OCR dose would flow directly into a medicine reminder telling a patient the wrong dosage — a patient-safety issue, not just a UX bug. Structured, reminder-driving prescriptions must always be explicitly entered/confirmed by the doctor; a photo of the handwritten script is fine as an attached reference only.
- Single clinic first: founder has existing relationships with clinics/doctors to pilot with, which de-risks GTM and lets a real workflow validate the product before taking on multi-tenant onboarding, data isolation, and compliance complexity (DPDP Act, since this is India-context).

## Trade-offs accepted:
- Not positioning as industry-wide/generic yet — may need re-marketing work when expanding to other specialties or to hospitals.
- No OCR-based auto-digitization of handwritten prescriptions in v1 — doctors/staff must type or confirm structured entries, which is slower than snapping a photo.
- Patient self-logging ships as a capability but its adoption/habit-formation design is explicitly deferred, not solved, in this phase.
- Multi-tenant architecture (tenant isolation, per-hospital onboarding, compliance-at-scale) is deferred; single-clinic scope may require rework when expanding.

## Supersedes: None — first decision for this domain.
