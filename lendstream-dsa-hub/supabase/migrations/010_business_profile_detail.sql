-- Business-profile detail shown on the prototype's Business tab: premises,
-- scale, Udyam registration and sales mix. None of it can be read off any
-- document we parse, so it is captured on the lead itself.
--
-- All nullable. A lead is still captured with only name/phone/loan type/amount;
-- an unfilled column renders as "—" on the Business tab rather than being
-- fabricated.

alter table public.leads
  add column if not exists business_premises_ownership text
    check (business_premises_ownership in ('OWNED', 'RENTED', 'LEASED')),
  add column if not exists business_years_at_premises numeric(4,1),
  add column if not exists business_employee_count integer,
  add column if not exists business_udyam_registered boolean,
  -- Share of sales made on credit (vs cash) — drives the structure recommendation.
  add column if not exists business_credit_sales_percent numeric(5,2),
  -- Largest customer as a share of sales, when not available from GST returns.
  add column if not exists business_customer_concentration_percent numeric(5,2);
