# NewsFlow — Setup Guide

## Prerequisites

- Node.js 18+
- npm
- A free [Supabase](https://supabase.com) account
- (Optional) Free [GNews API key](https://gnews.io)
- (Optional) [Anthropic API key](https://console.anthropic.com) for AI insight tags

---

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Name it `newsflow`, choose a region close to you
3. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2 — Run Database Migrations

In your Supabase project, go to **SQL Editor** and run each file in order:

1. Paste and run `supabase/migrations/001_schema.sql`
2. Paste and run `supabase/migrations/002_rls.sql`

---

## Step 3 — Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...        # Optional — enables AI insight tags
GNEWS_API_KEY=your-key-here         # Optional — adds global macro fallback
GITHUB_PAT=ghp_...                  # Optional — higher GitHub rate limits
```

---

## Step 4 — Install Dependencies & Run Locally

```bash
# Frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Step 5 — Run the Ingestion Worker Locally

```bash
cd worker
npm install
cp .env.example .env
# Fill in .env with same values as above

# Run worker (polls every 15 minutes)
npm start
```

The worker will immediately fetch articles from all sources and insert them into Supabase.

---

## Step 6 — Deploy the Worker to Railway (free)

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub Repo**
2. Point it at this repo, set **Root Directory** to `newsflow/worker`
3. Add environment variables (same as `worker/.env.example`)
4. Railway detects the `Procfile` and runs the worker automatically

---

## Step 7 — Deploy the Frontend to Vercel (free)

1. Go to [vercel.com](https://vercel.com) → **New Project → Import Git Repository**
2. Set **Root Directory** to `newsflow`
3. Add all environment variables from `.env.local`
4. Deploy

---

## Enable Supabase Realtime (for live feed updates)

1. In Supabase → **Database → Replication**
2. Enable replication on the `articles` table
3. The frontend already subscribes via `postgres_changes` — no code changes needed

---

## Purge Old Articles (optional cron)

In Supabase **SQL Editor**, set up a scheduled job (pg_cron):

```sql
SELECT cron.schedule('purge-old-articles', '0 3 * * *', 'SELECT public.purge_old_articles()');
```

This runs daily at 3am and removes articles older than 30 days (while keeping user signals).

---

## Architecture Summary

```
Vercel (Next.js frontend)
  ↕ Supabase Auth (JWT sessions)
  ↕ Supabase Postgres (articles, signals, profiles)
  ↕ Supabase Realtime (live article push)

Railway (Node.js worker)
  → RSS feeds + HN API + Reddit API + GitHub API + GNews API
  → Crawlee scrapers (Entrackr, NDTV Tech — robots.txt checked)
  → Claude Haiku API (AI insight tags, cached in DB)
  → Inserts into Supabase every 15 minutes
```
