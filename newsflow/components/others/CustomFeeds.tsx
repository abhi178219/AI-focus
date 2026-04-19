'use client'

import { useState, useEffect } from 'react'
import { getCustomFeeds, addCustomFeed, removeCustomFeed } from '@/lib/localStorage'
import type { CustomFeed } from '@/lib/types'

interface FeedArticle {
  title: string
  url: string
  excerpt: string | null
  published_at: string | null
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CustomFeeds() {
  const [feeds, setFeeds] = useState<CustomFeed[]>([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedArticles, setFeedArticles] = useState<Record<string, FeedArticle[]>>({})
  const [loadingFeed, setLoadingFeed] = useState<string | null>(null)

  useEffect(() => {
    const saved = getCustomFeeds()
    setFeeds(saved)
    // Load articles for existing feeds
    saved.forEach((f) => loadFeed(f))
  }, [])

  async function loadFeed(feed: CustomFeed) {
    setLoadingFeed(feed.id)
    try {
      const res = await fetch('/api/custom-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rss_url: feed.rss_url }),
      })
      if (!res.ok) return
      const data = await res.json()
      setFeedArticles((prev) => ({ ...prev, [feed.id]: data.items }))
    } catch {}
    setLoadingFeed(null)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return
    setAdding(true)
    setError(null)

    // Validate URL is reachable
    try {
      new URL(url)
    } catch {
      setError('Please enter a valid URL')
      setAdding(false)
      return
    }

    const feed = addCustomFeed(name.trim(), url.trim())
    setFeeds((prev) => [...prev, feed])
    await loadFeed(feed)
    setName('')
    setUrl('')
    setAdding(false)
  }

  function handleRemove(id: string) {
    removeCustomFeed(id)
    setFeeds((prev) => prev.filter((f) => f.id !== id))
    setFeedArticles((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Add feed form */}
      <div className="bg-white rounded-xl border border-stone-200 p-4">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Add Medium / Substack feed</h3>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Feed name (e.g. Paul Graham Essays)"
            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="RSS URL (e.g. https://paulgraham.com/rss.html)"
            type="url"
            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-stone-400">
            Medium: <code className="bg-stone-100 px-1 rounded">medium.com/feed/@username</code>
            {' · '}
            Substack: <code className="bg-stone-100 px-1 rounded">name.substack.com/feed</code>
          </p>
          <button
            type="submit"
            disabled={adding || !name.trim() || !url.trim()}
            className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {adding ? 'Adding…' : 'Add feed'}
          </button>
        </form>
      </div>

      {/* Saved feeds + their articles */}
      {feeds.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <p className="text-sm text-stone-400 text-center">
            No custom feeds yet. Add your favourite Medium or Substack above.
          </p>
        </div>
      ) : (
        feeds.map((feed) => (
          <div key={feed.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">{feed.name}</h3>
              <button
                onClick={() => handleRemove(feed.id)}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>

            {loadingFeed === feed.id ? (
              <p className="text-xs text-stone-400">Loading…</p>
            ) : (feedArticles[feed.id] ?? []).length === 0 ? (
              <p className="text-xs text-stone-400">No articles found or feed unavailable.</p>
            ) : (
              (feedArticles[feed.id] ?? []).map((a, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400">{feed.name}</span>
                    <span className="text-xs text-stone-300">{timeAgo(a.published_at)}</span>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-stone-900 hover:text-blue-700 line-clamp-3 leading-snug"
                  >
                    {a.title}
                  </a>
                  {a.excerpt && <p className="text-xs text-stone-500 line-clamp-2">{a.excerpt}</p>}
                </div>
              ))
            )}
          </div>
        ))
      )}
    </div>
  )
}
