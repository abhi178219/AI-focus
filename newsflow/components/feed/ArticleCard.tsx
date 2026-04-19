'use client'

import { useState, useEffect } from 'react'
import { saveArticle, unsaveArticle, isArticleSaved, markAsRead, isRead } from '@/lib/localStorage'
import type { Article } from '@/lib/types'

interface Props {
  article: Article
  userSignal?: 'up' | 'down' | null
  onSignal: (articleId: string, signal: 'up' | 'down', title: string) => Promise<void>
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function ArticleCard({ article, userSignal, onSignal }: Props) {
  const [saved, setSaved] = useState(false)
  const [read, setRead] = useState(false)
  const [localSignal, setLocalSignal] = useState(userSignal ?? null)
  const [signaling, setSignaling] = useState(false)

  useEffect(() => {
    setSaved(isArticleSaved(article.id))
    setRead(isRead(article.id))
  }, [article.id])

  function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (saved) {
      unsaveArticle(article.id)
      setSaved(false)
    } else {
      saveArticle(article)
      setSaved(true)
    }
  }

  async function handleSignal(signal: 'up' | 'down') {
    if (signaling) return
    setSignaling(true)
    const next = localSignal === signal ? null : signal
    if (next) {
      setLocalSignal(next)
      await onSignal(article.id, next, article.title)
    } else {
      setLocalSignal(null)
    }
    setSignaling(false)
  }

  function handleClick() {
    markAsRead(article.id)
    setRead(true)
  }

  return (
    <article className={`bg-white rounded-xl border border-stone-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow ${read ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-stone-400 truncate">{article.source}</span>
        <span className="text-xs text-stone-300 shrink-0">{timeAgo(article.published_at ?? article.ingested_at)}</span>
      </div>

      {/* Title */}
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="text-sm font-semibold text-stone-900 leading-snug hover:text-blue-700 line-clamp-3"
      >
        {article.title}
      </a>

      {/* Excerpt */}
      {article.excerpt && (
        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
          {article.excerpt}
        </p>
      )}

      {/* AI Insight tag */}
      {article.ai_insight && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Why it matters: </span>
            {article.ai_insight}
          </p>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSignal('up')}
            disabled={signaling}
            title="Thumbs up"
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              localSignal === 'up'
                ? 'bg-green-100 text-green-600'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            👍
          </button>
          <button
            onClick={() => handleSignal('down')}
            disabled={signaling}
            title="Thumbs down"
            className={`p-1.5 rounded-lg text-sm transition-colors ${
              localSignal === 'down'
                ? 'bg-red-100 text-red-500'
                : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
            }`}
          >
            👎
          </button>
        </div>

        <button
          onClick={handleSave}
          title={saved ? 'Remove bookmark' : 'Bookmark'}
          className={`p-1.5 rounded-lg text-sm transition-colors ${
            saved
              ? 'bg-amber-100 text-amber-500'
              : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
          }`}
        >
          {saved ? '🔖' : '🏷️'}
        </button>
      </div>
    </article>
  )
}
