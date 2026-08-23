alter table public.interactions drop constraint interactions_channel_check;
alter table public.interactions add constraint interactions_channel_check
  check (channel in ('CALL', 'WHATSAPP', 'EMAIL', 'BRANCH_MEETING', 'FIELD_VISIT', 'STAGE_CHANGE'));
