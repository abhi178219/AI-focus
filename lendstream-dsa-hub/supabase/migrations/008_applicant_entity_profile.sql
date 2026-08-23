-- Applicant + entity profile fields shown across the prototype's Overview /
-- Applicant / Business tabs. All nullable: a lead is still captured with only
-- name/phone/loan type/amount, and these get filled in later by the user or
-- applied from a parsed document. Nothing here is ever fabricated.

alter table public.leads
  add column if not exists date_of_birth date,
  add column if not exists gender text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  add column if not exists marital_status text check (marital_status in ('SINGLE', 'MARRIED', 'OTHER')),
  add column if not exists employment_type text check (employment_type in ('SALARIED', 'SELF_EMPLOYED')),
  add column if not exists residence_city text,
  -- Entity / business profile (self-employed files)
  add column if not exists business_name text,
  add column if not exists business_constitution text check (business_constitution in
    ('PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'LLP', 'PUBLIC_LIMITED')),
  add column if not exists business_vintage_years numeric(5,1),
  add column if not exists industry text;

-- Document types backing the Bureau / Financials / Stock sections.
alter table public.documents drop constraint if exists documents_type_check;
alter table public.documents add constraint documents_type_check check (type in (
  'PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DEED',
  'BUILDER_AGREEMENT', 'OCCUPANCY_CERTIFICATE', 'PROPERTY_VALUATION',
  'ITR', 'GST_RETURNS', 'CREDIT_REPORT', 'STOCK_STATEMENT', 'FINANCIAL_STATEMENT',
  'OTHER'
));
