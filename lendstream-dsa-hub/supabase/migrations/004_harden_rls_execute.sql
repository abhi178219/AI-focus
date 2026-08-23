-- Hardening pass after an independent (Codex) review of 002/003:
-- 1. current_user_role()/is_ops_admin() were public-schema SECURITY DEFINER
--    functions, callable directly via PostgREST RPC by anon/authenticated.
--    Moved the canonical versions into a non-PostgREST-exposed `private`
--    schema; the public versions are kept (for anything already referencing
--    them) but EXECUTE is revoked from anon/authenticated so they're no
--    longer callable as RPC endpoints, only usable internally by policies
--    owned by a role with implicit access.
-- 2. handle_new_user() is a trigger function — cannot actually be invoked via
--    RPC (trigger functions take no ordinary arguments), but EXECUTE is
--    revoked anyway as defense in depth.
-- 3. documents.uploaded_by was spoofable — insert/update didn't check it
--    matched the caller. Fixed.
-- 4. Storage policies only checked path segment 1 (agent_id), not that
--    segment 2 (lead_id) is actually a lead that agent owns — a partner
--    could write into another partner's lead folder as long as segment 1
--    was their own uid. Fixed with an EXISTS check against leads.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles as p where p.id = auth.uid()
$$;

create or replace function private.is_ops_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'ops_admin', false)
$$;

revoke all on function private.current_user_role() from public, anon, authenticated, service_role;
grant execute on function private.current_user_role() to authenticated;
revoke all on function private.is_ops_admin() from public, anon, authenticated, service_role;
grant execute on function private.is_ops_admin() to authenticated;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles as p where p.id = auth.uid()
$$;

create or replace function public.is_ops_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_user_role() = 'ops_admin', false)
$$;

revoke all on function public.current_user_role() from public, anon, authenticated, service_role;
revoke all on function public.is_ops_admin() from public, anon, authenticated, service_role;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, role, full_name, email, phone)
  values (
    new.id, 'dsa_partner',
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email, new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;

-- Re-point every policy at the private helper and add missing WITH CHECK clauses.

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_ops_admin());

drop policy if exists "profiles_update_ops" on public.profiles;
create policy "profiles_update_ops" on public.profiles for update to authenticated
  using (private.is_ops_admin()) with check (private.is_ops_admin());

drop policy if exists "products_write_ops" on public.products;
create policy "products_write_ops" on public.products for all to authenticated
  using (private.is_ops_admin()) with check (private.is_ops_admin());

drop policy if exists "leads_select_own_or_ops" on public.leads;
create policy "leads_select_own_or_ops" on public.leads for select to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin());

drop policy if exists "leads_update_own_or_ops" on public.leads;
create policy "leads_update_own_or_ops" on public.leads for update to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin())
  with check (agent_id = auth.uid() or private.is_ops_admin());

drop policy if exists "documents_select_via_lead" on public.documents;
create policy "documents_select_via_lead" on public.documents for select to authenticated
  using (exists (select 1 from public.leads l where l.id = documents.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

drop policy if exists "documents_insert_via_lead" on public.documents;
create policy "documents_insert_via_lead" on public.documents for insert to authenticated
  with check (
    (private.is_ops_admin() or uploaded_by is null or uploaded_by = auth.uid())
    and exists (select 1 from public.leads l where l.id = documents.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin()))
  );

drop policy if exists "documents_update_via_lead" on public.documents;
create policy "documents_update_via_lead" on public.documents for update to authenticated
  using (exists (select 1 from public.leads l where l.id = documents.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())))
  with check (
    (private.is_ops_admin() or uploaded_by is null or uploaded_by = auth.uid())
    and exists (select 1 from public.leads l where l.id = documents.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin()))
  );

drop policy if exists "assessments_select_via_lead" on public.assessments;
create policy "assessments_select_via_lead" on public.assessments for select to authenticated
  using (exists (select 1 from public.leads l where l.id = assessments.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

drop policy if exists "assessments_insert_via_lead" on public.assessments;
create policy "assessments_insert_via_lead" on public.assessments for insert to authenticated
  with check (exists (select 1 from public.leads l where l.id = assessments.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

drop policy if exists "assessment_pillars_select_via_assessment" on public.assessment_pillars;
create policy "assessment_pillars_select_via_assessment" on public.assessment_pillars for select to authenticated
  using (exists (
    select 1 from public.assessments a join public.leads l on l.id = a.lead_id
    where a.id = assessment_pillars.assessment_id and (l.agent_id = auth.uid() or private.is_ops_admin())
  ));

drop policy if exists "assessment_pillars_insert_via_assessment" on public.assessment_pillars;
create policy "assessment_pillars_insert_via_assessment" on public.assessment_pillars for insert to authenticated
  with check (exists (
    select 1 from public.assessments a join public.leads l on l.id = a.lead_id
    where a.id = assessment_pillars.assessment_id and (l.agent_id = auth.uid() or private.is_ops_admin())
  ));

drop policy if exists "interactions_select_via_lead" on public.interactions;
create policy "interactions_select_via_lead" on public.interactions for select to authenticated
  using (exists (select 1 from public.leads l where l.id = interactions.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

-- Was partner-only; ops now able to log interactions (e.g. branch-visit follow-up) too.
drop policy if exists "interactions_insert_via_lead" on public.interactions;
create policy "interactions_insert_via_lead" on public.interactions for insert to authenticated
  with check (
    private.is_ops_admin()
    or (agent_id = auth.uid() and exists (select 1 from public.leads l where l.id = interactions.lead_id and l.agent_id = auth.uid()))
  );

drop policy if exists "lender_offers_select_via_lead" on public.lender_offers;
create policy "lender_offers_select_via_lead" on public.lender_offers for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lender_offers.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

drop policy if exists "lender_offers_write_via_lead" on public.lender_offers;
create policy "lender_offers_write_via_lead" on public.lender_offers for all to authenticated
  using (exists (select 1 from public.leads l where l.id = lender_offers.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())))
  with check (exists (select 1 from public.leads l where l.id = lender_offers.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

drop policy if exists "commission_slabs_write_ops" on public.commission_slabs;
create policy "commission_slabs_write_ops" on public.commission_slabs for all to authenticated
  using (private.is_ops_admin()) with check (private.is_ops_admin());

-- Storage: force bucket private even if it already existed, and require the
-- lead_id path segment to actually be a lead the partner owns (previously
-- only the agent_id segment was checked).
insert into storage.buckets (id, name, public) values ('lead-documents', 'lead-documents', false)
  on conflict (id) do update set public = false;

drop policy if exists "lead_documents_select_own_or_ops" on storage.objects;
create policy "lead_documents_select_own_or_ops" on storage.objects for select to authenticated
  using (
    bucket_id = 'lead-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.leads l where l.id::text = (storage.foldername(name))[2] and l.agent_id = auth.uid())
      )
    )
  );

drop policy if exists "lead_documents_insert_own_or_ops" on storage.objects;
create policy "lead_documents_insert_own_or_ops" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'lead-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.leads l where l.id::text = (storage.foldername(name))[2] and l.agent_id = auth.uid())
      )
    )
  );

drop policy if exists "lead_documents_update_own_or_ops" on storage.objects;
create policy "lead_documents_update_own_or_ops" on storage.objects for update to authenticated
  using (
    bucket_id = 'lead-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.leads l where l.id::text = (storage.foldername(name))[2] and l.agent_id = auth.uid())
      )
    )
  )
  with check (
    bucket_id = 'lead-documents'
    and (
      private.is_ops_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (select 1 from public.leads l where l.id::text = (storage.foldername(name))[2] and l.agent_id = auth.uid())
      )
    )
  );
