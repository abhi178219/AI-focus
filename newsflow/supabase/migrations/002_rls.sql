-- Enable RLS on all tables
alter table public.articles enable row level security;
alter table public.user_signals enable row level security;
alter table public.user_profiles enable row level security;

-- articles: all authenticated users can read; only service role can write
create policy "articles_select" on public.articles
  for select to authenticated using (true);

-- user_signals: users can only read/write their own signals
create policy "signals_select_own" on public.user_signals
  for select to authenticated using (user_id = auth.uid());

create policy "signals_insert_own" on public.user_signals
  for insert to authenticated with check (user_id = auth.uid());

create policy "signals_update_own" on public.user_signals
  for update to authenticated using (user_id = auth.uid());

-- user_profiles: users can only read/update their own profile
create policy "profiles_select_own" on public.user_profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_update_own" on public.user_profiles
  for update to authenticated using (id = auth.uid());
