-- Ops-advisor review of 016/017 found: `applicants` had RLS enabled with no
-- DELETE policy at all, so createLead's rollback-on-failure
-- (`.from('applicants').delete()...` when the paired Application insert
-- fails) matched zero rows and returned no error — a guaranteed silent
-- no-op, not a narrow race, leaving a permanent phantom Applicant on every
-- such failure. Mirrors the same own-or-ops pattern as every other table.
create policy "applicants_delete_own" on public.applicants for delete to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin());

-- Also flagged: no index on the column any future "does this number already
-- have a file" lookup would filter on.
create index applicants_phone_idx on public.applicants (phone);
