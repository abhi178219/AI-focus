-- Three sub-tabs under Activity: Customer / Internal / Bank interactions.
-- `category` splits the log; `party` carries who the interaction was with,
-- meaning depends on category — the internal team (Sales/BM/Ops/Management)
-- for INTERNAL, the bank/lender name for BANK, unused for CUSTOMER. One
-- column rather than two, since exactly one of those meanings ever applies
-- to a given row.

alter table public.interactions
  add column category text not null default 'CUSTOMER' check (category in ('CUSTOMER', 'INTERNAL', 'BANK')),
  add column party text;

-- MEETING added for internal/bank interactions that aren't a customer-facing
-- branch visit or field visit — same relaxation pattern as
-- 007_stage_change_channel.sql.
alter table public.interactions drop constraint interactions_channel_check;
alter table public.interactions add constraint interactions_channel_check
  check (channel in ('CALL', 'WHATSAPP', 'EMAIL', 'BRANCH_MEETING', 'FIELD_VISIT', 'MEETING', 'STAGE_CHANGE'));

create index interactions_lead_category_idx on public.interactions (lead_id, category, occurred_at desc);
