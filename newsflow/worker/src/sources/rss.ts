import Parser from 'rss-parser'
import type { RawArticle, Category } from '../types.js'

const parser = new Parser({ timeout: 10000, maxRedirects: 3 })

interface FeedConfig {
  url: string
  source: string
  category: Category
}

const RSS_FEEDS: FeedConfig[] = [
  // AI & LLM
  { url: 'https://hnrss.org/frontpage', source: 'Hacker News', category: 'ai_llm' },
  { url: 'https://huggingface.co/blog/feed.xml', source: 'Hugging Face Blog', category: 'ai_llm' },

  // Dev Tools & OSS
  { url: 'https://dev.to/feed', source: 'Dev.to', category: 'dev_tools' },
  { url: 'https://changelog.com/feed', source: 'The Changelog', category: 'dev_tools' },

  // India Business & Startup
  { url: 'https://yourstory.com/feed', source: 'YourStory', category: 'india_business' },
  { url: 'https://inc42.com/feed/', source: 'Inc42', category: 'india_business' },
  { url: 'https://www.livemint.com/rss/technology', source: 'Livemint Tech', category: 'india_business' },

  // Global Macro & Markets
  { url: 'https://feeds.reuters.com/reuters/businessNews', source: 'Reuters Business', category: 'global_macro' },
  { url: 'https://feeds.apnews.com/rss/apf-business', source: 'AP Business', category: 'global_macro' },
]

function excerpt(text: string | undefined): string | null {
  if (!text) return null
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return clean.slice(0, 200) || null
}

export async function fetchRssFeeds(): Promise<RawArticle[]> {
  const results: RawArticle[] = []

  await Promise.allSettled(
    RSS_FEEDS.map(async ({ url, source, category }) => {
      try {
        const feed = await parser.parseURL(url)
        for (const item of feed.items.slice(0, 20)) {
          if (!item.link || !item.title) continue
          results.push({
            url: item.link,
            title: item.title.trim(),
            source,
            category,
            excerpt: excerpt(item.contentSnippet ?? item.content ?? item.summary),
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          })
        }
      } catch (err) {
        console.warn(`RSS fetch failed for ${source}:`, (err as Error).message)
      }
    })
  )

  return results
}

export async function fetchCustomFeed(rssUrl: string): Promise<RawArticle[]> {
  try {
    const feed = await parser.parseURL(rssUrl)
    return feed.items.slice(0, 20).flatMap((item) => {
      if (!item.link || !item.title) return []
      return [{
        url: item.link,
        title: item.title.trim(),
        source: feed.title ?? rssUrl,
        category: 'others' as Category,
        excerpt: excerpt(item.contentSnippet ?? item.content),
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      }]
    })
  } catch {
    return []
  }
}
