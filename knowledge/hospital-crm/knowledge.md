# Hospital/Clinic CRM — Knowledge

## Product shape
- Long-term vision: unified platform with a doctor app, a patient app, and a web admin/monitoring dashboard, covering booking, prescriptions, medicine adherence tracking + reminders, clinic/pharmacy inventory, patient records, diagnostics, document uploads, location search (doctors/pharmacy/diagnostics), insurance, and surgery consultation + post-care.
- That full scope is a multi-year build across three surfaces — not attempted at once. See [decisions/2026-08-02-hospital-crm-mvp-scope.md](../../decisions/2026-08-02-hospital-crm-mvp-scope.md) for the wedge chosen.

## Go-to-market
- Founder plans to approach clinics/doctors they already personally know for the pilot — this is a warm-relationship GTM, not cold platform sales. Reduces adoption risk relative to a from-scratch multi-tenant sales motion.
- Plan is single clinic/doctor pilot first, multi-tenant hospital platform later.

## Core v1 loop
Doctor digitizes patient record → writes a structured prescription (typed in-app) → vitals (BP/sugar, etc.) logged at the visit by staff → patient app shows active prescription + medicine reminders → (later) patient can self-log vitals at home → doctor sees a trend, not a single reading, at the next visit → drives the revisit/follow-up conversation.

## Target specialty flavor
- Chronic-care physicians/GPs managing diabetes and hypertension are the sharpest initial audience: high patient volume, recurring visits, adherence-sensitive, and a trend (not a single reading) is clinically meaningful. Underlying data model should stay generic (any vital type, any specialty) even though v1's UX/positioning is chronic-care-flavored.

## Prescription capture — safety-critical constraint
- Doctors currently handwrite prescriptions on paper.
- A photo of the handwritten prescription may be uploaded and attached to the patient record as a reference/audit document.
- The structured prescription that drives medicine reminders must always be explicitly typed or confirmed by the doctor — never auto-populated live from OCR. A misread dose becomes an incorrect reminder, i.e. a patient-safety issue, not just a UX bug.
- Open question (not yet resolved): whether doctors will type into the app mid-consult, or whether a staff member transcribes after the visit. Decides whether v1 needs a very fast in-consult entry UI (autocomplete/favorites for the doctor's own frequently-used drugs) or a short post-visit staff data-entry step is acceptable.

## Vitals tracking
- Modeled as one primitive: reading value + vital type + timestamp + source (staff-at-visit vs. patient-self-logged). Supporting both entry paths is cheap once this model exists — it's the same feature with two entry points, not two features.
- Patient self-logging adoption is a habit-formation/growth problem (reminders, streaks, showing the patient their own trend as payoff), separate from whether the feature exists.

## Multi-clinic architecture (deferred, deliberately)
- `profiles.clinic_id` is a single value, not a many-to-many `clinic_memberships` join table. An independent review flagged this breaks the moment one doctor works at two clinics (common in India) and argued it's cheaper to restructure now (empty tables) than after real patient data exists.
- Deliberately deferred anyway: this is a single-clinic pilot, so the multi-clinic-doctor case isn't live yet, and restructuring `current_clinic_id()` from a scalar to a set mid-build (while doctor/patient/admin portal UI is still being written) would touch every RLS policy at the moment they're least tested — higher risk of introducing a new access-control bug than the risk of deferring. Do this as its own deliberate, tested migration (with an RLS allow/deny test suite) when clinic #2 actually gets onboarded, not speculatively now.

## Regional context
- Founder is India-based (Hyderabad, per other repo activity) — insurance design should account for cashless-network-style integration (different from US-style claims), and compliance should be scoped against India's DPDP Act rather than HIPAA, once that phase is reached.
