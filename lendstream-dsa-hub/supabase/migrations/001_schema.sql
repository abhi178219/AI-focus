-- LendStream DSA Hub — core schema.
-- One flat organization (no clinic/tenant equivalent) — every dsa_partner
-- shares the same product catalog and commission structure.

create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'dsa_partner' check (role in ('dsa_partner', 'ops_admin')),
  full_name text,
  email text,
  phone text,
  region text,
  pan_number text,
  aadhaar_last4 text,
  dsa_agreement_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('PL', 'HL', 'LAP')),
  description text,
  is_active boolean not null default true,
  min_interest_rate numeric not null,
  max_interest_rate numeric not null,
  min_tenure_years numeric not null,
  max_tenure_years numeric not null,
  max_foir_percent numeric not null,
  default_processing_fee_percent numeric not null default 1,
  min_salary_required numeric,
  max_ltv_percent numeric,
  pillar_weights jsonb not null default '{"BANKING":25,"BUREAU":25,"COLLATERAL":25,"GST":25}',
  required_documents text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  client_name text not null,
  phone text not null,
  email text,
  pan_number text,
  loan_type text not null check (loan_type in ('PL', 'HL', 'LAP', 'BOTH')),
  monthly_income numeric,
  existing_emis numeric not null default 0,
  requested_amount numeric not null,
  tenure_years numeric,
  property_value numeric,
  property_stage text check (property_stage in ('READY_TO_MOVE', 'UNDER_CONSTRUCTION')),
  property_city text,
  has_co_applicant boolean not null default false,
  co_applicant_income numeric,
  stage text not null default 'NEW' check (stage in (
    'NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTATION', 'ASSESSMENT',
    'LOGGED_IN', 'SANCTIONED', 'DISBURSED', 'DROPPED'
  )),
  calculated_eligible_amount numeric,
  cibil_score integer,
  bank_assigned text,
  disbursed_amount numeric,
  product_id uuid references public.products(id),
  crm_synced boolean not null default false,
  crm_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_agent_stage_idx on public.leads (agent_id, stage);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null check (type in (
    'PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DEED',
    'BUILDER_AGREEMENT', 'OCCUPANCY_CERTIFICATE', 'ITR', 'GST_RETURNS', 'OTHER'
  )),
  name text not null,
  storage_path text not null,
  file_mime text,
  status text not null default 'uploaded' check (status in ('uploaded', 'parsing', 'verified', 'rejected')),
  ocr_text text,
  extracted_json jsonb,
  extraction_model text,
  extraction_pipeline_version text,
  extraction_confidence numeric,
  extraction_error text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz
);

create index documents_lead_idx on public.documents (lead_id);

-- Append-only / versioned: a lead can be re-assessed as new documents land.
-- The UI reads the latest row per lead (order by computed_at desc limit 1)
-- rather than mutating a single "current" row, preserving a full audit trail.
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  composite_score numeric not null,
  composite_band text not null check (composite_band in ('STRONG', 'GOOD', 'MODERATE', 'WEAK', 'CRITICAL')),
  verdict text not null check (verdict in ('PASS', 'REFER', 'DECLINE')),
  knockouts jsonb not null default '[]',
  governing_capacity numeric,
  binding_constraint text,
  dscr numeric,
  dscr_band text,
  proposed_emi numeric,
  recommendation text,
  watch_items jsonb not null default '[]',
  source_document_ids uuid[] not null default '{}',
  rules_version text not null default 'v1',
  computed_at timestamptz not null default now()
);

create index assessments_lead_idx on public.assessments (lead_id, computed_at desc);

create table public.assessment_pillars (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  pillar_code text not null check (pillar_code in ('BANKING', 'BUREAU', 'COLLATERAL', 'GST')),
  score numeric not null,
  band text not null check (band in ('STRONG', 'GOOD', 'MODERATE', 'WEAK', 'CRITICAL')),
  headline text,
  signals jsonb not null default '[]'
);

create index assessment_pillars_assessment_idx on public.assessment_pillars (assessment_id);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  channel text not null check (channel in ('CALL', 'WHATSAPP', 'EMAIL', 'BRANCH_MEETING', 'FIELD_VISIT')),
  outcome text,
  note text,
  occurred_at timestamptz not null default now(),
  next_follow_up date
);

create index interactions_lead_idx on public.interactions (lead_id, occurred_at desc);

create table public.lender_offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  bank_name text not null,
  product_id uuid references public.products(id),
  interest_rate numeric not null,
  tenure_years numeric not null,
  processing_fee_percent numeric not null default 1,
  approved_amount numeric not null,
  emi numeric,
  status text not null default 'draft' check (status in ('draft', 'shared', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index lender_offers_lead_idx on public.lender_offers (lead_id);

create table public.commission_slabs (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  product_category text not null check (product_category in ('PL', 'HL', 'LAP')),
  slab_min_amount numeric not null,
  slab_max_amount numeric,
  commission_percent numeric not null
);
