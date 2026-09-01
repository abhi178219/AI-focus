-- Policy CREATION is now open to every signed-in user, per explicit user
-- request — same "open write" carve-out already given to lender_products
-- (see 019_lender_products_open_write.sql), applied only to insert here.
--
-- Activate / deactivate / duplicate-as-new-version stay ops-admin only: those
-- are publish-control actions (going live, retiring, versioning), closer in
-- spirit to the reference requirements sheet's Policy Approver/Admin than its
-- Policy Author — and this app only has two roles, so that split has to land
-- somewhere. Any signed-in user can author a draft; only ops_admin can put it
-- live or take it down.

drop policy "policies_insert_ops" on public.policies;

create policy "policies_insert_authenticated" on public.policies for insert to authenticated
  with check (auth.role() = 'authenticated');
