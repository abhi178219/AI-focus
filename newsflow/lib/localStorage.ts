import type { SavedArticle, CustomFeed, Article } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

const SAVED_KEY = 'nf_saved'
const FEEDS_KEY = 'nf_custom_feeds'
const READ_KEY = 'nf_read'

// ─── Saved Posts ─────────────────────────────────────────────────────────────

export function getSavedArticles(): SavedArticle[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveArticle(article: Article): void {
  const saved = getSavedArticles()
  if (saved.some((a) => a.article_id === article.id)) return
  saved.unshift({
    article_id: article.id,
    title: article.title,
    url: article.url,
    source: article.source,
    category: article.category,
    excerpt: article.excerpt,
    ai_insight: article.ai_insight,
    savedAt: new Date().toISOString(),
  })
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
}

export function unsaveArticle(articleId: string): void {
  const saved = getSavedArticles().filter((a) => a.article_id !== articleId)
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
}

export function isArticleSaved(articleId: string): boolean {
  return getSavedArticles().some((a) => a.article_id === articleId)
}

// ─── Custom Feeds ─────────────────────────────────────────────────────────────

export function getCustomFeeds(): CustomFeed[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FEEDS_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addCustomFeed(name: string, rss_url: string): CustomFeed {
  const feeds = getCustomFeeds()
  const feed: CustomFeed = { id: uuidv4(), name, rss_url, addedAt: new Date().toISOString() }
  feeds.push(feed)
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
  return feed
}

export function removeCustomFeed(id: string): void {
  const feeds = getCustomFeeds().filter((f) => f.id !== id)
  localStorage.setItem(FEEDS_KEY, JSON.stringify(feeds))
}

// ─── Read State ───────────────────────────────────────────────────────────────

export function getReadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

export function markAsRead(articleId: string): void {
  const ids = getReadIds()
  ids.add(articleId)
  // Cap at 1000 to avoid localStorage bloat
  const arr = Array.from(ids).slice(-1000)
  localStorage.setItem(READ_KEY, JSON.stringify(arr))
}

export function isRead(articleId: string): boolean {
  return getReadIds().has(articleId)
}
