-- Company Applicants + Key Personnel, HubSpot Company/Contact style, per
-- explicit user choice on 2026-08-31. A company is just an Applicant with
-- entity_type='COMPANY' (client_name holds the company name); each key
-- person is a full, independent Applicant of their own (entity_type=
-- 'INDIVIDUAL', own name/phone/PAN/address) so they get their own
-- Application list, list page row, detail page etc. for free — nothing
-- about `leads` or the existing Applicant machinery needs to change.
-- `key_personnel` is purely the association + their role at the company.
-- See /decisions/2026-08-31-lendstream-dsa-hub-company-key-personnel.md.

alter table public.applicants
  add column entity_type text not null default 'INDIVIDUAL' check (entity_type in ('INDIVIDUAL', 'COMPANY'));

create table public.key_personnel (
  id uuid primary key default gen_random_uuid(),
  company_applicant_id uuid not null references public.applicants(id) on delete cascade,
  -- A real person is one distinct identity — the same individual Applicant
  -- can't be key personnel at two different companies at once.
  linked_applicant_id uuid not null references public.applicants(id) unique,
  designation text,
  created_at timestamptz not null default now()
);

create index key_personnel_company_idx on public.key_personnel (company_applicant_id);

alter table public.key_personnel enable row level security;

-- Same "own rows, or ops sees all" pattern as every other table, scoped
-- through the parent company Applicant's agent_id.
create policy "key_personnel_select_via_company" on public.key_personnel for select to authenticated
  using (exists (select 1 from public.applicants a where a.id = company_applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())));

-- Insert-only-own, no ops carve-out — matches leads_insert_own precedent:
-- ops can view everything but never originates data on a partner's book.
create policy "key_personnel_insert_own" on public.key_personnel for insert to authenticated
  with check (exists (select 1 from public.applicants a where a.id = company_applicant_id and a.agent_id = auth.uid()));

create policy "key_personnel_delete_own" on public.key_personnel for delete to authenticated
  using (exists (select 1 from public.applicants a where a.id = company_applicant_id and a.agent_id = auth.uid()));
