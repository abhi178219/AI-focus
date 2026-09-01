-- 023 added select/insert/delete policies on key_personnel but missed
-- update — editing a key person's designation (added this pass) silently
-- failed with 0 rows affected (RLS filters rather than erroring) until this.
create policy "key_personnel_update_own" on public.key_personnel for update to authenticated
  using (exists (select 1 from public.applicants a where a.id = company_applicant_id and a.agent_id = auth.uid()))
  with check (exists (select 1 from public.applicants a where a.id = company_applicant_id and a.agent_id = auth.uid()));
