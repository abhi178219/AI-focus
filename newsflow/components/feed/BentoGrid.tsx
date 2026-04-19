'use client'

import useSWR from 'swr'
import { useEffect, useState, useCallback } from 'react'
import CategoryLane from './CategoryLane'
import OnboardingNudge from '@/components/ui/OnboardingNudge'
import { createClient } from '@/lib/supabase/client'
import type { Article, Category } from '@/lib/types'
import { CATEGORY_ORDER } from '@/lib/types'

const POLL_INTERVAL = 60_000 // 60 seconds

async function fetchArticles(): Promise<{ articles: Article[]; signalCount: number }> {
  const res = await fetch('/api/articles?limit=100')
  if (!res.ok) throw new Error('Failed to fetch articles')
  return res.json()
}

function groupByCategory(articles: Article[]): Record<Category, Article[]> {
  const groups: Record<string, Article[]> = {}
  for (const cat of CATEGORY_ORDER) groups[cat] = []
  for (const a of articles) {
    if (groups[a.category]) groups[a.category].push(a)
  }
  return groups as Record<Category, Article[]>
}

export default function BentoGrid() {
  const { data, error, mutate } = useSWR('/api/articles', fetchArticles, {
    refreshInterval: POLL_INTERVAL,
    revalidateOnFocus: false,
  })
  const [signals, setSignals] = useState<Record<string, 'up' | 'down'>>({})

  // Fetch existing user signals on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: rows } = await supabase
        .from('user_signals')
        .select('article_id, signal')
        .eq('user_id', user.id)
      if (rows) {
        const map: Record<string, 'up' | 'down'> = {}
        for (const r of rows as Array<{ article_id: string; signal: string }>) {
          map[r.article_id] = r.signal as 'up' | 'down'
        }
        setSignals(map)
      }
    })
  }, [])

  // Supabase Realtime: subscribe to new articles
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('articles-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'articles' }, () => {
        mutate()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [mutate])

  const handleSignal = useCallback(async (articleId: string, signal: 'up' | 'down', title: string) => {
    setSignals((prev) => ({ ...prev, [articleId]: signal }))
    await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ article_id: articleId, signal, title }),
    })
  }, [])

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-red-500">Failed to load feed. Retrying…</p>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-stone-400">Loading your feed…</p>
      </div>
    </div>
  )

  const groups = groupByCategory(data.articles)
  const showOnboarding = data.signalCount < 10

  return (
    <div className="flex flex-col gap-4">
      {showOnboarding && <OnboardingNudge signalCount={data.signalCount} />}

      {/* Bento CSS Grid — 5 equal columns on desktop, collapses on mobile */}
      <div className="grid gap-4" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        {CATEGORY_ORDER.map((cat) => (
          <CategoryLane
            key={cat}
            category={cat}
            articles={groups[cat].slice(0, 15)}
            signals={signals}
            onSignal={handleSignal}
          />
        ))}
      </div>
    </div>
  )
}
