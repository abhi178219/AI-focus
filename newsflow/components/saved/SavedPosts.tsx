'use client'

import { useState, useEffect } from 'react'
import { getSavedArticles, unsaveArticle } from '@/lib/localStorage'
import type { SavedArticle } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function SavedPosts() {
  const [articles, setArticles] = useState<SavedArticle[]>([])

  useEffect(() => {
    setArticles(getSavedArticles())
  }, [])

  function handleRemove(articleId: string) {
    unsaveArticle(articleId)
    setArticles((prev) => prev.filter((a) => a.article_id !== articleId))
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-4xl">🏷️</span>
        <p className="text-sm text-stone-500 text-center">
          No saved articles yet.<br />
          Tap the bookmark on any card to save it here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">
        {articles.length} saved article{articles.length !== 1 ? 's' : ''}
      </p>

      {articles.map((a) => (
        <div key={a.article_id} className="bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-stone-400 truncate">{a.source}</span>
              <span className="text-xs text-stone-300">·</span>
              <span className="text-xs text-stone-300 shrink-0">{timeAgo(a.savedAt)}</span>
            </div>
            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full shrink-0">
              {CATEGORY_LABELS[a.category]}
            </span>
          </div>

          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-stone-900 hover:text-blue-700 line-clamp-3 leading-snug"
          >
            {a.title}
          </a>

          {a.excerpt && (
            <p className="text-xs text-stone-500 line-clamp-2">{a.excerpt}</p>
          )}

          {a.ai_insight && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Why it matters: </span>
                {a.ai_insight}
              </p>
            </div>
          )}

          <button
            onClick={() => handleRemove(a.article_id)}
            className="self-end text-xs text-stone-400 hover:text-red-500 transition-colors mt-1"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
