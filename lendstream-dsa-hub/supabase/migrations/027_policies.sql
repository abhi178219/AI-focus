-- Credit policies — the authoring/browsing repository behind the Policy tab.
--
-- Deliberately a small slice of the enterprise "Configurable LOS Policy
-- Engine" requirements sheet: this table stores policy *configuration* only.
-- There is no rule-evaluation engine, no Decision-tab wiring and no Auto Run
-- here — the requirements sheet's own scope table lists those as out of
-- scope / a downstream dependency. There is also no maker-checker approval
-- chain: this app has exactly two roles (dsa_partner, ops_admin) and no
-- separate Approver, so versioning is single-actor.
--
-- Versioning model: `policy_code` is the stable identity ("the same policy"),
-- `version` increments per revision. A published version is never edited in
-- place — an ops admin duplicates it as a new DRAFT instead. Activating a
-- version flips any other ACTIVE version of the same policy_code to INACTIVE,
-- so a policy_code never has two live versions at once.

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  -- Stable identity shared across versions, e.g. 'PL-STD'. Uppercased on write.
  policy_code text not null,
  version int not null default 1,
  name text not null,
  description text,
  product text not null check (product in ('PL', 'HL', 'LAP', 'BL', 'WC')),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'INACTIVE')),
  -- Lower number = evaluated first if several policies ever apply to one file.
  -- Informational in this scope: nothing consumes it yet.
  priority int not null default 100,
  effective_from date,
  effective_to date,
  -- Why this version exists — the human half of the version history.
  change_reason text,
  -- Curated parameter groups (applicant / financial / bureau / collateral /
  -- pricing / decision). Shape mirrors the PolicyParams interfaces in
  -- lib/types.ts; jsonb rather than columns because the group list is
  -- expected to grow and nothing queries into it server-side yet.
  params jsonb not null default '{}',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (policy_code, version)
);

create index policies_code_idx on public.policies (policy_code);
create index policies_product_status_idx on public.policies (product, status);

alter table public.policies enable row level security;

-- Readable by every signed-in user: partners need to see live policy the same
-- way they see the product catalogue. Writes are ops-only — policy
-- configuration is a credit/ops function, so this mirrors `products` rather
-- than the open-write `lender_products`.
create policy "policies_select_all" on public.policies for select to authenticated
  using (auth.role() = 'authenticated');

-- private.is_ops_admin(), never public.is_ops_admin() — EXECUTE on the public
-- version was revoked from authenticated in migration 004, so a policy
-- calling it silently denies everything.
create policy "policies_insert_ops" on public.policies for insert to authenticated
  with check (private.is_ops_admin());

create policy "policies_update_ops" on public.policies for update to authenticated
  using (private.is_ops_admin())
  with check (private.is_ops_admin());

create policy "policies_delete_ops" on public.policies for delete to authenticated
  using (private.is_ops_admin());
