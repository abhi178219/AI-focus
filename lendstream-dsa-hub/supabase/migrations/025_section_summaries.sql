-- Per-section AI summaries — same pattern as leads.case_narrative
-- (005_case_narrative.sql), generalised to one row per (lead, section) so
-- every analytical tab (Banking, ITR, GST, Bureau, Financials, Business,
-- Stock, Collateral) can carry its own generated-on-demand summary at the
-- top, not just the single overall case narrative.
create table public.section_summaries (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  section_code text not null,
  summary text not null,
  model text,
  generated_at timestamptz not null default now(),
  unique (lead_id, section_code)
);

create index section_summaries_lead_idx on public.section_summaries (lead_id);

alter table public.section_summaries enable row level security;

-- Same own-or-ops pattern as every other lead-scoped table, and the same
-- "ops can regenerate too" latitude leads.case_narrative already has (it's
-- read/analysis on an existing file, not originating new lead data).
create policy "section_summaries_select_via_lead" on public.section_summaries for select to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));

create policy "section_summaries_write_via_lead" on public.section_summaries for all to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())))
  with check (exists (select 1 from public.leads l where l.id = lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())));
