-- RLS + role-trust hardening, applied from day one rather than retrofitted.
-- See /decisions/2026-08-02-hospital-crm-rls-hardening.md for the incident
-- this pattern is designed to prevent: a handle_new_user() trigger trusting
-- client-supplied role metadata, and an RLS policy that only restricted row
-- access (not column access), letting a user self-elevate their own role.

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;
alter table public.documents enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_pillars enable row level security;
alter table public.interactions enable row level security;
alter table public.lender_offers enable row level security;
alter table public.commission_slabs enable row level security;

-- SECURITY DEFINER helper: reading role via a normal query inside a profiles
-- RLS policy would recurse into profiles' own RLS. This function runs with
-- the privileges of its owner, bypassing that recursion safely.
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_ops_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_user_role() = 'ops_admin', false);
$$;

-- New auth users always land as the lowest-privilege role, regardless of any
-- role/etc. a client tries to smuggle through signup metadata. Elevation to
-- ops_admin only ever happens via a service-role client (seed script for MVP).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id,
    'dsa_partner',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles: self-select, ops sees all. Self-update is column-restricted —
-- role is never client-writable, matching the hospital-crm fix.
create policy "profiles_select_self" on public.profiles for select
  using (id = auth.uid() or public.is_ops_admin());

revoke update on public.profiles from authenticated;
grant update (full_name, phone, region) on public.profiles to authenticated;

create policy "profiles_update_self" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_ops" on public.profiles for update
  using (public.is_ops_admin());

-- products: readable by any authenticated user (partners need to see the
-- catalog); only ops can write.
create policy "products_select_all" on public.products for select
  using (auth.role() = 'authenticated');

create policy "products_write_ops" on public.products for all
  using (public.is_ops_admin())
  with check (public.is_ops_admin());

-- leads: a partner only sees/creates their own; ops sees/edits all.
create policy "leads_select_own_or_ops" on public.leads for select
  using (agent_id = auth.uid() or public.is_ops_admin());

create policy "leads_insert_own" on public.leads for insert
  with check (agent_id = auth.uid());

create policy "leads_update_own_or_ops" on public.leads for update
  using (agent_id = auth.uid() or public.is_ops_admin());

-- documents / assessments / assessment_pillars / interactions / lender_offers:
-- scoped through the parent lead's agent_id via an EXISTS join.
create policy "documents_select_via_lead" on public.documents for select
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "documents_insert_via_lead" on public.documents for insert
  with check (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "documents_update_via_lead" on public.documents for update
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "assessments_select_via_lead" on public.assessments for select
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "assessments_insert_via_lead" on public.assessments for insert
  with check (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "assessment_pillars_select_via_assessment" on public.assessment_pillars for select
  using (exists (
    select 1 from public.assessments a
    join public.leads l on l.id = a.lead_id
    where a.id = assessment_id and (l.agent_id = auth.uid() or public.is_ops_admin())
  ));

create policy "assessment_pillars_insert_via_assessment" on public.assessment_pillars for insert
  with check (exists (
    select 1 from public.assessments a
    join public.leads l on l.id = a.lead_id
    where a.id = assessment_id and (l.agent_id = auth.uid() or public.is_ops_admin())
  ));

create policy "interactions_select_via_lead" on public.interactions for select
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "interactions_insert_via_lead" on public.interactions for insert
  with check (agent_id = auth.uid() and exists (select 1 from public.leads l where l.id = lead_id and l.agent_id = auth.uid()));

create policy "lender_offers_select_via_lead" on public.lender_offers for select
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

create policy "lender_offers_write_via_lead" on public.lender_offers for all
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())))
  with check (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or public.is_ops_admin())));

-- commission_slabs: readable by all authenticated (Analytics screen), ops writes.
create policy "commission_slabs_select_all" on public.commission_slabs for select
  using (auth.role() = 'authenticated');

create policy "commission_slabs_write_ops" on public.commission_slabs for all
  using (public.is_ops_admin())
  with check (public.is_ops_admin());
