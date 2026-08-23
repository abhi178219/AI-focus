-- Lender-specific product options. The `products` table holds the product
-- FAMILY policy (max FOIR, LTV, required documents); this holds each lender's
-- concrete offering within that family, which is what the catalogue view,
-- the calculators and the offers ranking actually quote from.
create table if not exists public.lender_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  lender_name text not null,
  short_code text not null,
  display_name text not null,
  interest_rate numeric(5,2) not null check (interest_rate > 0),
  max_sanction_amount bigint not null check (max_sanction_amount > 0),
  min_tenure_years numeric(4,1) not null,
  max_tenure_years numeric(4,1) not null,
  processing_fee_percent numeric(5,2) not null default 1,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists lender_products_product_idx on public.lender_products(product_id);

alter table public.lender_products enable row level security;

-- Catalogue is shared reference data: every signed-in user reads it.
drop policy if exists "lender_products read" on public.lender_products;
create policy "lender_products read" on public.lender_products
  for select to authenticated using (true);

-- Only ops admins may change the catalogue.
drop policy if exists "lender_products write" on public.lender_products;
create policy "lender_products write" on public.lender_products
  for all to authenticated
  using (private.is_ops_admin())
  with check (private.is_ops_admin());
