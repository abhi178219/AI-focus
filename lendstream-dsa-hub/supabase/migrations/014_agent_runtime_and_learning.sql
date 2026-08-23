-- Agentic runtime + the three learning signals. Applied via MCP; mirrored here.
-- See /decisions/2026-08-23-lendstream-agentic-decisioning.md for why the
-- deterministic engine is retained as a recorded reference.
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  skill text not null,
  model text not null,
  status text not null default 'running' check (status in ('running','succeeded','failed')),
  input_snapshot jsonb,
  tool_calls jsonb not null default '[]',
  output jsonb,
  reasoning text,
  reference_verdict text,
  reference_score numeric(5,2),
  error text,
  latency_ms integer,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_lead_idx on public.agent_runs(lead_id, created_at desc);
create index if not exists agent_runs_skill_idx on public.agent_runs(skill, created_at desc);

create table if not exists public.extraction_corrections (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  document_type text not null,
  field text not null,
  extracted_value text,
  corrected_value text,
  kind text not null check (kind in ('overwrite','accept','manual_fill')),
  model text,
  corrected_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists extraction_corrections_field_idx
  on public.extraction_corrections(document_type, field, created_at desc);

create table if not exists public.decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  predicted_verdict text,
  predicted_score numeric(5,2),
  actual_outcome text not null,
  actual_amount bigint,
  notes text,
  recorded_by uuid references public.profiles(id),
  occurred_at timestamptz not null default now()
);
create index if not exists decision_outcomes_lead_idx on public.decision_outcomes(lead_id);

create table if not exists public.learned_policies (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  rule_key text not null,
  proposal jsonb not null,
  rationale text,
  evidence_count integer not null default 0,
  status text not null default 'proposed' check (status in ('proposed','approved','rejected','superseded')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists learned_policies_status_idx on public.learned_policies(status, scope);

alter table public.agent_runs enable row level security;
alter table public.extraction_corrections enable row level security;
alter table public.decision_outcomes enable row level security;
alter table public.learned_policies enable row level security;

drop policy if exists "agent_runs scoped to lead" on public.agent_runs;
create policy "agent_runs scoped to lead" on public.agent_runs
  for all to authenticated
  using (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id))
  with check (lead_id is null or exists (select 1 from public.leads l where l.id = lead_id));

drop policy if exists "decision_outcomes scoped to lead" on public.decision_outcomes;
create policy "decision_outcomes scoped to lead" on public.decision_outcomes
  for all to authenticated
  using (exists (select 1 from public.leads l where l.id = lead_id))
  with check (exists (select 1 from public.leads l where l.id = lead_id));

drop policy if exists "extraction_corrections scoped to document" on public.extraction_corrections;
create policy "extraction_corrections scoped to document" on public.extraction_corrections
  for all to authenticated
  using (exists (select 1 from public.documents d where d.id = document_id))
  with check (exists (select 1 from public.documents d where d.id = document_id));

drop policy if exists "learned_policies read" on public.learned_policies;
create policy "learned_policies read" on public.learned_policies
  for select to authenticated using (true);

drop policy if exists "learned_policies write" on public.learned_policies;
create policy "learned_policies write" on public.learned_policies
  for all to authenticated
  using (private.is_ops_admin()) with check (private.is_ops_admin());
