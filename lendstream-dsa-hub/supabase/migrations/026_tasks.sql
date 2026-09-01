-- Tasks: follow-ups and to-dos, optionally tied to an Applicant and/or a
-- specific Application (lead) — either can be set alone (a task about a
-- person generally, or about one specific application) or both together.
-- Own-or-ops RLS throughout, same shape as every other table here.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id),
  applicant_id uuid references public.applicants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null,
  notes text,
  due_date date,
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'PENDING' check (status in ('PENDING', 'COMPLETED')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_agent_idx on public.tasks (agent_id, status, due_date);
create index tasks_applicant_idx on public.tasks (applicant_id);
create index tasks_lead_idx on public.tasks (lead_id);

alter table public.tasks enable row level security;

create policy "tasks_select_own_or_ops" on public.tasks for select to authenticated
  using (agent_id = auth.uid() or private.is_ops_admin());

create policy "tasks_insert_own" on public.tasks for insert to authenticated
  with check (agent_id = auth.uid());

create policy "tasks_update_own" on public.tasks for update to authenticated
  using (agent_id = auth.uid())
  with check (agent_id = auth.uid());

create policy "tasks_delete_own" on public.tasks for delete to authenticated
  using (agent_id = auth.uid());
