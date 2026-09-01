-- Supersedes the "ops-only catalogue writes" decision from
-- 2026-08-22-lendstream-dsa-hub-prototype-fidelity-rebuild.md, per explicit
-- user choice on 2026-08-31: the prototype lets any signed-in user add a
-- lender product from the Products tab, and the user chose to match that
-- rather than keep the earlier ops-only restriction. See
-- /decisions/2026-08-31-lendstream-dsa-hub-open-catalogue-writes.md.
drop policy if exists "lender_products write" on public.lender_products;
create policy "lender_products write" on public.lender_products
  for all to authenticated
  using (true)
  with check (true);
