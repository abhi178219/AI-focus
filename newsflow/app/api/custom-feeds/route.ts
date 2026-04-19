import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Fetch articles from a user-provided RSS URL (server-side to avoid CORS)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rss_url } = await request.json()
  if (!rss_url || typeof rss_url !== 'string') {
    return NextResponse.json({ error: 'rss_url required' }, { status: 400 })
  }

  try {
    // Validate URL
    new URL(rss_url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Fetch and parse RSS server-side
  const res = await fetch(rss_url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*' },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 502 })

  const xml = await res.text()

  // Minimal XML→JSON parse (title + link + description per item)
  const items: Array<{ title: string; url: string; excerpt: string | null; published_at: string | null }> = []
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i)
    const link = block.match(/<link[^>]*>(.*?)<\/link>|<guid[^>]*isPermaLink="true"[^>]*>(.*?)<\/guid>/i)
    // Use [\s\S] instead of . with /s flag for ES2017 compat
    const desc = block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description[^>]*>([\s\S]*?)<\/description>/i)
    const pubDate = block.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i)

    const titleText = (title?.[1] ?? title?.[2] ?? '').trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    const urlText = (link?.[1] ?? link?.[2] ?? '').trim()
    if (!titleText || !urlText) continue

    const rawDesc = (desc?.[1] ?? desc?.[2] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    items.push({
      title: titleText,
      url: urlText,
      excerpt: rawDesc.slice(0, 200) || null,
      published_at: pubDate?.[1] ? new Date(pubDate[1]).toISOString() : null,
    })

    if (items.length >= 20) break
  }

  return NextResponse.json({ items })
}
