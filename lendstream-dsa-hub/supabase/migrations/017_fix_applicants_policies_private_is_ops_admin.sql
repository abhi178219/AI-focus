-- 016_applicants.sql wrongly called public.is_ops_admin() (EXECUTE revoked
-- from authenticated by 004_harden_rls_execute.sql) instead of
-- private.is_ops_admin(), the callable version every other RLS policy in
-- this project actually uses. Without this fix every dashboard load errored
-- with "permission denied for function is_ops_admin" (42501) and the
-- Applicants section silently rendered empty.
drop policy if exists "applicants_select_own_or_ops" on public.applicants;
create policy "applicants_select_own_or_ops" on public.applicants for select to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin());

drop policy if exists "applicants_update_own_or_ops" on public.applicants;
create policy "applicants_update_own_or_ops" on public.applicants for update to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin())
  with check (agent_id = auth.uid() or private.is_ops_admin());
