import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { runAnalysis } from '../lib/api'

/* ── Demo data ─────────────────────────────────────────────────── */
const MOCK_REVIEW = {
  date:            new Date().toISOString().split('T')[0],
  market:          'NIFTY',
  total_trades:    3,
  win_count:       2,
  loss_count:      1,
  win_rate:        66.7,
  gross_pnl:       8320,
  false_triggers:  1,
  avg_confidence:  74,
  total_signals:   4,
  full_analysis:   'Strong session. Two clean ENTER signals converted well. One EMA21 breakdown failed at resistance — market reversed sharply. Claude was overconfident on the PE trade; RSI was not confirming on higher timeframe.',
  patterns_found:  [
    'EMA9/21 crossover with VWAP reclaim works consistently in first 90 mins of session',
    'High-volume breakouts above prior day high show 80%+ follow-through',
  ],
  claude_errors:   [
    'Entered NIFTY 24300 PE without higher-TF confirmation — missed 1H resistance overhead',
  ],
  false_triggers:  1,
  new_rules:       [
    'Do NOT enter PE trades when 1H chart shows price above 1H EMA21',
    'Require volume > 1.5× average on VWAP reclaim before ENTER signal',
  ],
  deployed:        false,
}

export function useAnalysis(market = 'NIFTY') {
  const [review,    setReview]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [deploying, setDeploying] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReview(MOCK_REVIEW)
      setLoading(false)
      return
    }

    const dateStr = new Date().toISOString().split('T')[0]

    async function fetchReview() {
      setLoading(true)
      const { data } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('market', market)
        .eq('date', dateStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setReview(data ?? null)
      setLoading(false)
    }

    fetchReview()
  }, [market])

  const triggerReview = useCallback(async () => {
    if (!supabase) {
      // Demo: show mock review
      setReview(MOCK_REVIEW)
      return
    }
    setDeploying(true)
    try {
      const data = await runAnalysis(market, false)
      setReview(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDeploying(false)
    }
  }, [market])

  const deployReview = useCallback(async () => {
    if (!review) return
    if (!supabase) {
      setReview(r => ({ ...r, deployed: true }))
      return
    }
    setDeploying(true)
    try {
      const data = await runAnalysis(market, true)
      setReview(data)
    } catch (e) {
      console.error(e)
    } finally {
      setDeploying(false)
    }
  }, [market, review])

  return { review, loading, deploying, triggerReview, deployReview }
}
