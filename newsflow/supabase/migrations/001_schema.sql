-- Articles table: stores ingested articles from all sources
create table if not exists public.articles (
  id            uuid primary key default gen_random_uuid(),
  url           text not null unique,
  title         text not null,
  source        text not null,
  category      text not null check (category in ('ai_llm', 'dev_tools', 'india_business', 'global_macro', 'others')),
  excerpt       text,
  ai_insight    text,
  published_at  timestamptz,
  ingested_at   timestamptz not null default now(),
  preference_score float default 0
);

create index if not exists articles_category_idx on public.articles (category);
create index if not exists articles_ingested_at_idx on public.articles (ingested_at desc);

-- User signals: thumbs up / down per article per user
create table if not exists public.user_signals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  article_id  uuid not null references public.articles (id) on delete cascade,
  signal      text not null check (signal in ('up', 'down')),
  created_at  timestamptz not null default now(),
  unique (user_id, article_id)
);

create index if not exists user_signals_user_idx on public.user_signals (user_id);

-- User profiles: stores TF-IDF interest vector and onboarding state
create table if not exists public.user_profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  user_interest_vector  jsonb default '{}'::jsonb,
  signal_count          int default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Purge articles older than 30 days (keep signals)
create or replace function public.purge_old_articles()
returns void language sql security definer as $$
  delete from public.articles
  where ingested_at < now() - interval '30 days'
    and id not in (select article_id from public.user_signals);
$$;
