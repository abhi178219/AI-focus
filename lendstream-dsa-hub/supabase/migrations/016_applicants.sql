-- Applicant/Application relation (HubSpot Contact→Deals style), per user request
-- 2026-08-31. An Applicant is the person; each Application (a `leads` row,
-- unchanged in shape) is one loan request from them. "New lead" continues to
-- create one Applicant + one Application together (today's 1:1 behaviour,
-- unchanged); a second Application under the same Applicant is only ever
-- added explicitly from that Applicant's own record — no auto-matching by
-- phone number, so two people can never get silently merged by a shared or
-- mistyped number. See /decisions/2026-08-31-lendstream-dsa-hub-applicant-application-relation.md.

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  client_name text not null,
  phone text not null,
  email text,
  residence_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applicants_agent_idx on public.applicants (agent_id);

alter table public.applicants enable row level security;

-- Same "own rows, or ops sees all" pattern as leads (002_rls.sql / 004_harden_rls_execute.sql).
create policy "applicants_select_own_or_ops" on public.applicants for select to authenticated
  using (agent_id = auth.uid() or public.is_ops_admin());

create policy "applicants_insert_own" on public.applicants for insert to authenticated
  with check (agent_id = auth.uid());

create policy "applicants_update_own_or_ops" on public.applicants for update to authenticated
  using (agent_id = auth.uid() or public.is_ops_admin());

-- Each lead (Application) belongs to exactly one Applicant.
alter table public.leads add column applicant_id uuid references public.applicants(id);
create index leads_applicant_idx on public.leads (applicant_id);

-- Backfill: every lead created before this migration already represents one
-- applicant 1:1 (the old model). Give each of them a real Applicant row built
-- from that lead's own already-real data — no fabricated fields — so nothing
-- in the UI regresses to "no applicant" for existing files.
insert into public.applicants (id, agent_id, client_name, phone, email, residence_address, created_at, updated_at)
select gen_random_uuid(), l.agent_id, l.client_name, l.phone, l.email, l.residence_address, l.created_at, l.updated_at
from public.leads l
where l.applicant_id is null;

update public.leads l
set applicant_id = a.id
from public.applicants a
where l.applicant_id is null
  and a.agent_id = l.agent_id
  and a.client_name = l.client_name
  and a.phone = l.phone
  and a.created_at = l.created_at;

alter table public.leads alter column applicant_id set not null;
