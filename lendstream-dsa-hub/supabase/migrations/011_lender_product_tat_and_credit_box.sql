-- Turnaround time and credit-box note are lender attributes the prototype
-- shows on the Offers table. They cannot be derived from anything we parse,
-- so they are captured on the catalogue row where ops can maintain them.
-- Both nullable: an unset value renders as "—" rather than a guess.
alter table public.lender_products
  add column if not exists turnaround_days integer check (turnaround_days > 0),
  add column if not exists credit_box_note text;
