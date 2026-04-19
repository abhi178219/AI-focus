'use client'

import ArticleCard from './ArticleCard'
import type { Article, UserSignal } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'

interface Props {
  category: Article['category']
  articles: Article[]
  signals: Record<string, 'up' | 'down'>
  onSignal: (articleId: string, signal: 'up' | 'down', title: string) => Promise<void>
}

export default function CategoryLane({ category, articles, signals, onSignal }: Props) {
  return (
    <div className="flex flex-col gap-3 min-w-0">
      <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 px-1">
        {CATEGORY_LABELS[category]}
      </h2>

      {articles.length === 0 ? (
        <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-6 text-center">
          <p className="text-xs text-stone-400">No articles yet — worker is fetching…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              userSignal={signals[article.id] ?? null}
              onSignal={onSignal}
            />
          ))}
        </div>
      )}
    </div>
  )
}
