-- Payout cycle varies by bank ("Monthly (7th)", "Bi-Weekly", …). It was being
-- hardcoded to "Monthly" in the UI, which presented an invented value as fact.
-- Nullable: renders as "—" until ops sets it.
alter table public.commission_slabs
  add column if not exists payout_cycle text;
