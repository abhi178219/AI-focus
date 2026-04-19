# Contributing to NewsFlow

Thank you for your interest in contributing! NewsFlow is intentionally lean — the goal is to keep it fast, focused, and easy to run locally. Contributions that stay true to that philosophy are most welcome.

---

## 🧭 What We're Looking For

Good contributions fall into one of these buckets:

| Type | Examples |
|---|---|
| **New news sources** | Add a new RSS feed, a Reddit sub, a GitHub repo to track |
| **India-specific sources** | More India tech/business sources — especially RSS feeds we're missing |
| **UI improvements** | Better card layout, filter by source, keyboard shortcuts |
| **AI layer** | Better Haiku prompts, summary quality improvements, insight caching |
| **Preference scoring** | Smarter TF-IDF, topic clustering, negative signal handling |
| **Bug fixes** | Anything from the issues list |
| **Worker reliability** | Retry logic, dead-letter queue, feed health monitoring |

If your idea doesn't fit a category above, open an issue first and let's discuss.

---

## 🗺️ Repository Layout

```
newsflow/
├── app/                    # Next.js frontend (App Router)
├── components/             # React components
├── lib/                    # Shared utilities (scoring, types, localStorage, supabase)
├── worker/src/             # Ingestion worker
│   └── sources/            # ← ADD NEW SOURCES HERE
├── supabase/migrations/    # DB schema + RLS
└── CONTRIBUTING.md         # This file
```

---

## 🔧 Local Setup

```bash
# 1. Fork + clone
git clone https://github.com/YOUR_USERNAME/AI_Product_manager_tools.git
cd AI_Product_manager_tools/newsflow

# 2. Install frontend deps
npm install

# 3. Configure env
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
# SUPABASE_SERVICE_ROLE_KEY (see README for Supabase setup steps)

# 4. Run migrations in Supabase SQL Editor:
#    supabase/migrations/001_schema.sql
#    supabase/migrations/002_rls.sql

# 5. Start the frontend
npm run dev

# 6. Start the worker (in a separate terminal)
cd worker && npm install && cp .env.example .env
# Fill in .env, then:
npm run build && node dist/index.js
```

---

## ➕ How to Add a New News Source

This is the most common contribution. All sources live in `worker/src/sources/`.

### Adding an RSS feed

Open `worker/src/sources/rss.ts` and add your feed to `RSS_FEEDS`:

```typescript
const RSS_FEEDS: FeedConfig[] = [
  // ... existing feeds ...

  // Your new feed:
  {
    url: 'https://example.com/feed.xml',
    source: 'Example Publication',
    category: 'ai_llm', // one of: ai_llm | dev_tools | india_business | global_macro | others
  },
]
```

**Category guide:**

| Category | Use for |
|---|---|
| `ai_llm` | AI research, model releases, LLM benchmarks |
| `dev_tools` | OSS releases, developer tools, frameworks |
| `india_business` | India startup funding, policy, business news |
| `global_macro` | Markets, economics, global business |
| `others` | Anything else (user-curated) |

### Adding a new source type (Reddit, API, etc.)

1. Create `worker/src/sources/your_source.ts`
2. Export an `async function fetchYourSource(): Promise<RawArticle[]>`
3. Import and call it in `worker/src/index.ts` inside `runPoll()`

```typescript
// worker/src/sources/your_source.ts
import type { RawArticle } from '../types.js'

export async function fetchYourSource(): Promise<RawArticle[]> {
  const results: RawArticle[] = []
  // ... fetch and parse ...
  return results
}
```

```typescript
// worker/src/index.ts — add to runPoll()
const [rss, hn, reddit, github, gnews, crawled, yours] = await Promise.allSettled([
  fetchRssFeeds(),
  fetchHackerNews(),
  // ...
  fetchYourSource(), // add here
])
```

### Crawler sources (JS-rendered pages)

For sites without RSS that need Playwright, add a new target to `worker/src/sources/crawler.ts`:

```typescript
const TARGETS: CrawlTarget[] = [
  // ... existing targets ...
  {
    name: 'YourSite',
    url: 'https://yoursite.com/news',
    category: 'india_business',
    articleSelector: 'article',
    titleSelector: 'h2',
    linkSelector: 'a',
    excerptSelector: 'p',
  },
]
```

> ⚠️ **Always check `robots.txt` before adding a crawler target.** The crawler does this automatically at runtime, but please verify manually before submitting a PR.

---

## 🤖 Improving AI Insight Tags

The prompt lives in `worker/src/ai-insight.ts`:

```typescript
const PROMPT = (headline: string, excerpt: string) =>
  `In 1–2 sentences, explain why this news matters to a tech-savvy product manager or developer. Be direct. No preamble.\n\nHeadline: ${headline}\nExcerpt: ${excerpt}`
```

If you have a better prompt or want to try structured output, modify this function. Keep the response under 150 words — cards are small.

---

## 🎨 UI Contributions

- All components are in `components/` using Tailwind CSS
- Light mode only (by design — dark mode is a future roadmap item)
- The bento grid uses CSS Grid with `auto-fit minmax(280px, 1fr)` — keep it responsive
- No component library — raw Tailwind only

---

## ✅ Pull Request Checklist

Before submitting:

- [ ] `npm run build` passes with zero errors inside `newsflow/`
- [ ] `npx tsc --noEmit` passes inside `newsflow/worker/`
- [ ] No API keys or secrets committed (check `.gitignore`)
- [ ] New RSS feeds verified working locally (articles appear in the feed)
- [ ] For crawler additions: `robots.txt` checked and allows crawling
- [ ] `README.md` updated if you added a new source to the sources table

---

## 📐 Code Style

- TypeScript everywhere — no `any` unless absolutely necessary
- Async/await over raw Promises
- `Promise.allSettled` for fetching multiple sources in parallel (never `Promise.all` — one failing source shouldn't break the rest)
- Graceful degradation: if an env var is missing, skip that source with a `console.warn`, don't throw
- Keep worker source files focused — one file per source type

---

## 🐛 Reporting Bugs

Open an [issue](https://github.com/abhi178219/AI_Product_manager_tools/issues/new) with:

1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Any relevant console output

---

## 💬 Questions?

Open an issue or reach out on LinkedIn: https://www.linkedin.com/in/sai-abhishek-v
