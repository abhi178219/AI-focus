-- No existing capture flow yields a pincode yet (neither the New lead form
-- nor document extraction) — this just makes the column available for the
-- Applicants list to show, honestly empty until something fills it in.
alter table public.applicants add column pincode text;
