-- Full applicant/entity capture set shown on the prototype's Applicant tab.
-- All nullable: a lead is still opened with name/phone/loan type/amount, and
-- these get filled in by the user when a document did not yield them.
--
-- Aadhaar: only the last four digits are ever stored, consistent with the
-- project's standing rule. There is deliberately no column for the full number.

alter table public.leads
  -- Applicant
  add column if not exists father_name text,
  add column if not exists qualification text,
  add column if not exists aadhaar_last4 text check (aadhaar_last4 ~ '^[0-9]{4}$'),

  -- Address
  add column if not exists residence_address text,
  add column if not exists permanent_same_as_current boolean not null default true,
  add column if not exists permanent_address text,
  add column if not exists residence_type text check (residence_type in
    ('OWNED', 'RENTED', 'COMPANY_PROVIDED', 'PARENTAL', 'LEASED')),
  add column if not exists years_at_residence numeric(4,1),

  -- Entity
  add column if not exists incorporation_date date,
  add column if not exists company_pan text,
  add column if not exists gstin text,
  add column if not exists udyam_number text,
  add column if not exists cin text,

  -- Role & premises
  add column if not exists designation text,
  add column if not exists din text,
  add column if not exists office_address text,

  -- Co-applicant
  add column if not exists co_applicant_name text,
  add column if not exists co_applicant_relationship text,
  add column if not exists co_applicant_dob date,
  add column if not exists co_applicant_pan text;
