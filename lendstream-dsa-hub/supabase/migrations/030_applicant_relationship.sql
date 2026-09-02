-- Relationship layer on the Applicant (the person/company), as opposed to the
-- per-application (`leads`) layer. Everything here is deliberately
-- `applicant_id`-scoped and kept SEPARATE from the existing `lead_id`-scoped
-- `documents`/`interactions` tables: a PAN card, a bureau-pull consent and a
-- "called them about the new WC line" touchpoint all belong to the person
-- across every application they ever make, not to one loan file. Copying them
-- onto each new application (or retro-fitting a nullable lead_id) would either
-- duplicate the same fact N times or make the per-application Activity tab's
-- Customer/Internal/Bank category split meaningless.
--
-- RLS throughout: own-or-ops, scoped through `public.applicants.agent_id`, and
-- always via private.is_ops_admin() — public.is_ops_admin() had EXECUTE revoked
-- from authenticated/anon in 004_harden_rls_execute.sql and any policy calling
-- it denies silently (see 017_fix_applicants_policies_private_is_ops_admin.sql).

-- ---------------------------------------------------------------------------
-- 1. Attribution on the Applicant itself
-- ---------------------------------------------------------------------------
alter table public.applicants
  add column lead_source_channel text check (lead_source_channel in ('ONDC', 'REFERRAL_PARTNER', 'ORGANIC', 'CAMPAIGN')),
  add column referring_partner text;

-- ---------------------------------------------------------------------------
-- 2. Consent history — append-only
-- ---------------------------------------------------------------------------
-- Never updated in place. A fresh capture supersedes the prior one purely by
-- being the latest `captured_at` for that (applicant, consent_type). An upsert
-- would destroy the record of what was consented to, when, and over which
-- channel — the exact thing a consent trail exists to preserve.
create table public.applicant_consents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  consent_type text not null check (consent_type in ('BUREAU_PULL', 'LENDER_DATA_SHARING', 'MARKETING')),
  granted boolean not null,
  -- How the consent was captured: app, SMS, email, WhatsApp, physical form.
  -- Nullable because an older/imported record may genuinely not know.
  channel text,
  captured_at timestamptz not null default now(),
  captured_by uuid not null references public.profiles(id)
);

create index applicant_consents_latest_idx
  on public.applicant_consents (applicant_id, consent_type, captured_at desc);

alter table public.applicant_consents enable row level security;

create policy "applicant_consents_select_via_applicant" on public.applicant_consents for select to authenticated
  using (exists (
    select 1 from public.applicants a
    where a.id = applicant_consents.applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())
  ));

-- Same shape as documents_insert_via_lead (004): ops may capture too, but the
-- `captured_by` stamp must be honest.
create policy "applicant_consents_insert_via_applicant" on public.applicant_consents for insert to authenticated
  with check (
    (private.is_ops_admin() or captured_by = auth.uid())
    and exists (
      select 1 from public.applicants a
      where a.id = applicant_consents.applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Applicant document vault
-- ---------------------------------------------------------------------------
-- Deliberately NOT public.documents (which is lead_id-scoped and feeds the AI
-- extraction pipeline). These are identity/entity papers that belong to the
-- person forever — stored and listed, never parsed. No update/delete policy:
-- append-only audit trail, same convention as public.documents.
create table public.applicant_documents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  type text not null check (type in ('PAN_CARD', 'AADHAAR', 'ENTITY_KYC', 'MOA_AOA', 'OTHER')),
  name text not null,
  storage_path text not null,
  file_mime text,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now()
);

create index applicant_documents_applicant_idx on public.applicant_documents (applicant_id);

alter table public.applicant_documents enable row level security;

create policy "applicant_documents_select_via_applicant" on public.applicant_documents for select to authenticated
  using (exists (
    select 1 from public.applicants a
    where a.id = applicant_documents.applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())
  ));

create policy "applicant_documents_insert_via_applicant" on public.applicant_documents for insert to authenticated
  with check (
    (private.is_ops_admin() or uploaded_by is null or uploaded_by = auth.uid())
    and exists (
      select 1 from public.applicants a
      where a.id = applicant_documents.applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Relationship-level touchpoints
-- ---------------------------------------------------------------------------
-- Separate from public.interactions (lead_id-scoped). The Customer/Internal/
-- Bank category split added in 029 is specific to working ONE loan file and is
-- deliberately NOT repeated here — a relationship touchpoint is always with the
-- customer.
create table public.applicant_interactions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  agent_id uuid not null references public.profiles(id),
  channel text not null check (channel in ('CALL', 'WHATSAPP', 'EMAIL', 'FIELD_VISIT', 'BRANCH_MEETING', 'MEETING')),
  note text,
  occurred_at timestamptz not null default now(),
  next_follow_up date
);

create index applicant_interactions_applicant_idx
  on public.applicant_interactions (applicant_id, occurred_at desc);

alter table public.applicant_interactions enable row level security;

create policy "applicant_interactions_select_via_applicant" on public.applicant_interactions for select to authenticated
  using (exists (
    select 1 from public.applicants a
    where a.id = applicant_interactions.applicant_id and (a.agent_id = auth.uid() or private.is_ops_admin())
  ));

-- Same shape as interactions_insert_via_lead (004): ops can always log, a
-- partner only on their own applicant and only under their own agent_id.
create policy "applicant_interactions_insert_via_applicant" on public.applicant_interactions for insert to authenticated
  with check (
    private.is_ops_admin()
    or (
      agent_id = auth.uid()
      and exists (
        select 1 from public.applicants a
        where a.id = applicant_interactions.applicant_id and a.agent_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Storage bucket for the vault
-- ---------------------------------------------------------------------------
-- Path convention: {agent_id}/{applicant_id}/{documentId}-{filename}
-- Mirrors lead-documents exactly (004), checking public.applicants ownership on
-- the second path segment instead of public.leads. No update/delete policy —
-- append-only, same precedent.
insert into storage.buckets (id, name, public)
values ('applicant-documents', 'applicant-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "applicant_documents_select_own_or_ops" on storage.objects;
create policy "applicant_documents_select_own_or_ops" on storage.objects for select to authenticated
  using (
    bucket_id = 'applicant-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.applicants a where a.id::text = (storage.foldername(name))[2] and a.agent_id = auth.uid())
      )
    )
  );

drop policy if exists "applicant_documents_insert_own_or_ops" on storage.objects;
create policy "applicant_documents_insert_own_or_ops" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'applicant-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.applicants a where a.id::text = (storage.foldername(name))[2] and a.agent_id = auth.uid())
      )
    )
  );
