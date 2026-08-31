alter table public.leads drop constraint leads_loan_type_check;
alter table public.leads add constraint leads_loan_type_check
  check (loan_type in ('PL', 'HL', 'LAP', 'BOTH', 'BL', 'WC'));
