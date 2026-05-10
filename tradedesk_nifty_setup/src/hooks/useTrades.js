import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/* ── Demo data (shown when Supabase env vars are not configured) ── */
const today = new Date().toISOString().split('T')[0]

const MOCK_TRADES = [
  {
    id:             'mock-1',
    created_at:     `${today}T04:15:00Z`,
    symbol:         'NIFTY 24400 CE',
    trigger_name:   'EMA9/21 crossover + VWAP reclaim',
    entry_price:    148.50,
    sl_price:       120.00,
    t1_price:       195.00,
    claude_verdict: 'ENTER',
    confidence:     82,
    claude_reason:  'Strong EMA crossover on 5M with VWAP reclaim. RSI 58 — momentum healthy. ATM CE with 1:1.65 R:R. Enter.',
    status:         'WIN',
    pnl_rs:         8320,
  },
  {
    id:             'mock-2',
    created_at:     `${today}T05:30:00Z`,
    symbol:         'NIFTY 24500 CE',
    trigger_name:   'VWAP rejection + RSI divergence',
    entry_price:    92.00,
    sl_price:       75.00,
    t1_price:       130.00,
    claude_verdict: 'WAIT',
    confidence:     55,
    claude_reason:  'Setup is borderline. VWAP rejection visible but volume is weak. RSI divergence not confirmed on higher TF. Waiting for cleaner entry.',
    status:         'OPEN',
    pnl_rs:         null,
  },
  {
    id:             'mock-3',
    created_at:     `${today}T06:45:00Z`,
    symbol:         'NIFTY 24300 PE',
    trigger_name:   'EMA21 breakdown + high volume',
    entry_price:    175.00,
    sl_price:       210.00,
    t1_price:       120.00,
    claude_verdict: 'ENTER',
    confidence:     74,
    claude_reason:  'Clean EMA21 breakdown on 15M chart. Put premium reasonable. Market structure bearish below VWAP. Entering.',
    status:         'LOSS',
    pnl_rs:         -5720,
  },
]

function calcStats(trades) {
  const wins   = trades.filter(t => t.status === 'WIN').length
  const losses = trades.filter(t => t.status === 'LOSS').length
  const open   = trades.filter(t => t.status === 'OPEN').length
  const total  = trades.length
  const grossPnl = trades.reduce((s, t) => s + (t.pnl_rs ?? 0), 0)
  const winRate  = total > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0
  return { total, wins, losses, open, grossPnl, winRate }
}

export function useTodayTrades(market = 'NIFTY') {
  const [trades,  setTrades]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // Demo mode — filter mock trades by a loose market match
      const filtered = MOCK_TRADES.filter(t =>
        t.symbol.toUpperCase().includes(market.toUpperCase())
      )
      setTrades(filtered.length ? filtered : MOCK_TRADES)
      setLoading(false)
      return
    }

    const dateStr = new Date().toISOString().split('T')[0]

    async function fetchTrades() {
      setLoading(true)
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('market', market)
        .gte('created_at', `${dateStr}T00:00:00Z`)
        .order('created_at', { ascending: false })

      if (!error) setTrades(data ?? [])
      setLoading(false)
    }

    fetchTrades()

    // Real-time subscription
    const channel = supabase
      .channel(`trades-${market}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades', filter: `market=eq.${market}` },
        () => fetchTrades()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [market])

  return { trades, stats: calcStats(trades), loading }
}
