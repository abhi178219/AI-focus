import type { RawArticle } from '../types.js'

const BASE = 'https://gnews.io/api/v4'

const QUERIES = [
  { q: 'stock market OR economy OR inflation', label: 'Global Macro' },
  { q: 'India startup OR India business OR India economy', label: 'India Business' },
]

export async function fetchGNews(): Promise<RawArticle[]> {
  const key = process.env.GNEWS_API_KEY
  if (!key) {
    console.warn('GNEWS_API_KEY not set — skipping GNews source')
    return []
  }

  const results: RawArticle[] = []

  await Promise.allSettled(
    QUERIES.map(async ({ q, label }) => {
      try {
        const url = `${BASE}/search?q=${encodeURIComponent(q)}&lang=en&max=10&apikey=${key}`
        const res = await fetch(url)
        if (!res.ok) return
        const data = await res.json()
        for (const article of data?.articles ?? []) {
          if (!article.url || !article.title) continue
          results.push({
            url: article.url,
            title: article.title,
            source: article.source?.name ?? 'GNews',
            category: label === 'India Business' ? 'india_business' : 'global_macro',
            excerpt: article.description?.slice(0, 200) ?? null,
            published_at: article.publishedAt ?? null,
          })
        }
      } catch (err) {
        console.warn(`GNews fetch failed for "${q}":`, (err as Error).message)
      }
    })
  )

  return results
}
