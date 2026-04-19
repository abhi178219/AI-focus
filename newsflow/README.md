# 📰 NewsFlow

> A real-time, AI-tagged news aggregator for small teams — bento layout, personalised feed, zero tab-switching.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Claude Haiku](https://img.shields.io/badge/AI-Claude%20Haiku-orange?style=flat-square)](https://anthropic.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

---

## 🤔 The Problem

A small team tracking tech, AI, India business, and global market news currently juggles **6–8 browser tabs daily** with no unified view, no saved reading list, and no intelligence layer. NewsFlow fixes all three.

---

## ✨ What it Does

| Feature | Detail |
|---|---|
| **Bento feed** | 5 category lanes in a CSS Grid layout — AI & LLMs, Dev Tools, India Business, Global Macro, Others |
| **AI insight tags** | Claude Haiku generates a 1–2 line "why this matters" blurb per article on ingest |
| **Personalised ranking** | Thumbs up/down → TF-IDF interest vector → re-ranked feed after 10 signals |
| **Saved posts** | Bookmark any article; persisted in localStorage |
| **Custom RSS feeds** | Add any Medium / Substack URL in the Others tab |
| **Real-time updates** | Supabase Realtime pushes new articles without a page refresh |
| **Auth** | Email + password via Supabase Auth; no SSO required |

---

## 🗂 Project Structure

```
newsflow/
├── app/                        # Next.js App Router
│   ├── (auth)/login            # Login page
│   ├── (auth)/signup           # Signup page
│   ├── actions/auth.ts         # Server actions (login, signup, logout)
│   ├── api/articles/           # Feed API + TF-IDF ranking
│   ├── api/signals/            # Thumbs up/down handler
│   ├── api/custom-feeds/       # Server-side RSS proxy
│   └── page.tsx                # Root — tab switcher
├── components/
│   ├── feed/                   # BentoGrid, CategoryLane, ArticleCard
│   ├── nav/BottomNav.tsx       # 3-tab bottom navigation
│   ├── saved/SavedPosts.tsx    # Bookmarked articles (localStorage)
│   ├── others/CustomFeeds.tsx  # User-added RSS feeds
│   └── ui/OnboardingNudge.tsx  # Cold-start prompt (< 10 signals)
├── lib/
│   ├── supabase/               # Browser + server + middleware clients
│   ├── scoring.ts              # TF-IDF preference scoring
│   ├── localStorage.ts         # nf_saved / nf_custom_feeds / nf_read
│   └── types.ts                # Shared TypeScript types + DB schema
├── worker/                     # Standalone ingestion worker
│   └── src/
│       ├── sources/            # rss.ts, hackernews.ts, reddit.ts, github.ts, gnews.ts, crawler.ts
│       ├── ai-insight.ts       # Claude Haiku tag generation
│       └── index.ts            # Main polling loop (every 15 min)
└── supabase/
    └── migrations/             # 001_schema.sql, 002_rls.sql
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) account
- (Optional) [Anthropic API key](https://console.anthropic.com) for AI insight tags
- (Optional) Free [GNews API key](https://gnews.io)

### 1 — Clone & install

```bash
git clone https://github.com/abhi178219/AI_Product_manager_tools.git
cd AI_Product_manager_tools/newsflow
npm install
```

### 2 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. In **SQL Editor**, run `supabase/migrations/001_schema.sql` then `002_rls.sql`
3. Go to **Settings → API** and copy your keys

### 3 — Configure env vars

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GNEWS_API_KEY=                  # optional
ANTHROPIC_API_KEY=              # optional — enables AI insight tags
```

### 4 — Run the frontend

```bash
npm run dev
# Open http://localhost:3000
```

### 5 — Run the ingestion worker

```bash
cd worker
npm install
cp .env.example .env   # fill in same values
npm run build
node dist/index.js
```

The worker fetches articles from all sources every 15 minutes and inserts them into Supabase. Your feed populates immediately on first run.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + Tailwind CSS |
| Data fetching | SWR (60s polling) + Supabase Realtime |
| Backend | Next.js API Routes (Node.js) |
| Ingestion worker | Node.js + rss-parser + Crawlee + Playwright |
| Database | Supabase Postgres |
| Auth | Supabase Auth (email + password) |
| AI tags | Anthropic Claude Haiku (optional, cached in DB) |
| Local state | localStorage (`nf_*` prefix) |
| Frontend hosting | Vercel (free tier) |
| Worker hosting | Railway or Fly.io (free tier) |

---

## 📡 News Sources

| Category | Sources |
|---|---|
| AI & LLMs | Hacker News, HuggingFace Blog, ArXiv RSS, r/MachineLearning, r/LocalLLaMA |
| Dev Tools & OSS | Dev.to, The Changelog, GitHub Releases (10 key repos), r/technology |
| India Business | YourStory, Inc42, Livemint Tech, Entrackr (crawled), r/IndiaInvestments |
| Global Macro | BBC Business, NYT Business, MarketWatch, GNews API |
| Others | User-added Medium / Substack RSS feeds |

---

## 🗺️ Roadmap

- [x] Bento feed with 5 categories
- [x] Claude Haiku AI insight tags
- [x] Thumbs up/down preference learning (TF-IDF)
- [x] Saved posts (localStorage)
- [x] Custom RSS feeds (Others tab)
- [x] Supabase Realtime (live article push)
- [x] Read/unread state
- [x] Onboarding nudge (cold-start)
- [ ] Mobile app (React Native)
- [ ] Cross-device saved posts sync (Supabase)
- [ ] AI-generated daily digest email
- [ ] Slack / Teams notification integration
- [ ] Full-text search across the feed
- [ ] Browser extension for one-click save

---

## 🙌 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding news sources, improving the UI, or extending the AI layer.

---

## 📬 Built by

[@abhi178219](https://github.com/abhi178219) — product manager exploring the frontier of AI-powered workflows.

- LinkedIn: https://www.linkedin.com/in/sai-abhishek-v
