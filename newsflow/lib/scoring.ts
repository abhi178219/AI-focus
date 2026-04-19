import type { Article } from '@/lib/types'

// Simple TF-IDF keyword scoring applied at the application layer.
// The user_interest_vector is a JSONB map of { keyword: weight }.

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'this', 'that', 'with', 'from', 'are', 'was', 'has',
  'its', 'not', 'but', 'they', 'have', 'had', 'will', 'been', 'can', 'out',
  'new', 'all', 'how', 'more', 'also', 'into', 'over', 'after', 'your', 'their',
])

function keywords(text: string): string[] {
  return tokenize(text).filter((t) => !STOP_WORDS.has(t))
}

export function buildInterestVector(
  existing: Record<string, number>,
  title: string,
  signal: 'up' | 'down'
): Record<string, number> {
  const weight = signal === 'up' ? 1 : -0.5
  const kws = keywords(title)
  const updated = { ...existing }
  for (const kw of kws) {
    updated[kw] = (updated[kw] ?? 0) + weight
  }
  return updated
}

export function scoreArticle(
  article: Article,
  vector: Record<string, number>
): number {
  if (Object.keys(vector).length === 0) return 0
  const kws = keywords(`${article.title} ${article.excerpt ?? ''}`)
  return kws.reduce((sum, kw) => sum + (vector[kw] ?? 0), 0)
}

export function rankArticles(
  articles: Article[],
  vector: Record<string, number>,
  signalCount: number
): Article[] {
  if (signalCount < 10) {
    // Cold start: chronological order
    return [...articles].sort(
      (a, b) =>
        new Date(b.published_at ?? b.ingested_at).getTime() -
        new Date(a.published_at ?? a.ingested_at).getTime()
    )
  }

  return [...articles].sort((a, b) => {
    const sa = scoreArticle(a, vector)
    const sb = scoreArticle(b, vector)
    if (sa !== sb) return sb - sa
    // Tie-break by recency
    return (
      new Date(b.published_at ?? b.ingested_at).getTime() -
      new Date(a.published_at ?? a.ingested_at).getTime()
    )
  })
}
