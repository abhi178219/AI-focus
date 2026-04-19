import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildInterestVector } from '@/lib/scoring'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { article_id, signal, title } = await request.json()
  if (!article_id || !signal || !['up', 'down'].includes(signal)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { error: signalError } = await supabase
    .from('user_signals')
    .upsert(
      { user_id: user.id, article_id, signal } as never,
      { onConflict: 'user_id,article_id' }
    )

  if (signalError) return NextResponse.json({ error: signalError.message }, { status: 500 })

  const { data: profileData } = await supabase
    .from('user_profiles')
    .select('user_interest_vector, signal_count')
    .eq('id', user.id)
    .single()

  const profile = profileData as { user_interest_vector: Record<string, number>; signal_count: number } | null
  const existing = profile?.user_interest_vector ?? {}
  const updated = buildInterestVector(existing, title ?? '', signal)

  await supabase
    .from('user_profiles')
    .update({
      user_interest_vector: updated,
      signal_count: (profile?.signal_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
