-- Per-lender-product document requirements (distinct from `products.required_documents`,
-- which is the product FAMILY's baseline — a given lender within that family
-- can require more, e.g. one bank wanting a valuation report others don't).
alter table public.lender_products
  add column required_documents text[] not null default '{}';
