import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rankArticles } from '@/lib/scoring'
import type { Article, Category } from '@/lib/types'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') as Category | null
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  let query = supabase
    .from('articles')
    .select('*')
    .order('ingested_at', { ascending: false })
    .limit(limit)

  if (category) query = query.eq('category', category)

  const { data: articles, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('user_interest_vector, signal_count')
    .eq('id', user.id)
    .single()

  const profile = profileData as { user_interest_vector: Record<string, number>; signal_count: number } | null
  const vector = profile?.user_interest_vector ?? {}
  const signalCount = profile?.signal_count ?? 0

  const ranked = rankArticles((articles ?? []) as Article[], vector, signalCount)
  return NextResponse.json({ articles: ranked, signalCount })
}
