'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import type { Article, Category } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/types'
import {
  saveArticle,
  unsaveArticle,
  getSavedArticles,
  markAsRead,
} from '@/lib/localStorage'
import { logout } from '@/app/actions/auth'
import styles from './editorial.module.css'

/* ── helpers ───────────────────────────────────────────────────── */
const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((d) => Array.isArray(d) ? d : (d.articles ?? []))

const COL_CATS: Category[] = ['ai_llm', 'dev_tools', 'india_business']
const COL_LABELS: Record<string, string> = {
  ai_llm: 'AI & LLMs',
  dev_tools: 'Dev Tools & OSS',
  india_business: 'India Business',
}

type SignalMap = Record<string, 'up' | 'down' | null>
type SaveMap  = Record<string, boolean>

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/* ── types ─────────────────────────────────────────────────────── */
interface Props {
  activeTab: 'news' | 'saved' | 'others'
  onTabChange: (tab: 'news' | 'saved' | 'others') => void
  savedCount: number
}

/* ── component ──────────────────────────────────────────────────── */
export default function EditorialFeed({ activeTab, onTabChange, savedCount }: Props) {
  const { data: articles = [], isLoading } = useSWR<Article[]>(
    '/api/articles',
    fetcher,
    { refreshInterval: 60000 }
  )

  const [signals, setSignals] = useState<SignalMap>({})
  const [saves,   setSaves]   = useState<SaveMap>({})
  const [dateStr, setDateStr] = useState('')
  const [signalCount, setSignalCount] = useState(0)

  useEffect(() => {
    const saved = getSavedArticles()
    const m: SaveMap = {}
    saved.forEach((a) => { m[a.article_id] = true })
    setSaves(m)
    setDateStr(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    )
  }, [])

  /* signal */
  async function handleSignal(articleId: string, kind: 'up' | 'down') {
    const current = signals[articleId]
    const next = current === kind ? null : kind
    setSignals((prev) => ({ ...prev, [articleId]: next }))
    if (next) {
      setSignalCount((n) => n + 1)
      await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, signal: next }),
      })
    }
  }

  /* save */
  function handleSave(article: Article) {
    const wasSaved = saves[article.id]
    if (wasSaved) {
      unsaveArticle(article.id)
    } else {
      saveArticle(article)
    }
    setSaves((prev) => ({ ...prev, [article.id]: !wasSaved }))
  }

  /* partition */
  const hero = articles[0] ?? null
  const colArticles: Record<string, Article[]> = { ai_llm: [], dev_tools: [], india_business: [] }
  const ribbonArticles: Article[] = []

  articles.slice(1).forEach((a) => {
    if (
      COL_CATS.includes(a.category) &&
      (colArticles[a.category]?.length ?? 0) < 5
    ) {
      colArticles[a.category].push(a)
    } else {
      ribbonArticles.push(a)
    }
  })

  const totalNew    = articles.length
  const readingMin  = Math.max(1, Math.ceil(totalNew * 1.8))
  const progressPct = Math.min(100, (signalCount / 10) * 100)

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.wrap}>
      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;0,9..144,900;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {isLoading ? (
        <div className="loading">Loading today&apos;s edition…</div>
      ) : (
        <div className="shell">

          {/* ── MASTHEAD ─────────────────────────────────── */}
          <header className="masthead">
            <div className="edition">
              <span>Vol. I · Today&apos;s Edition</span>
              <b>{dateStr}</b>
            </div>
            <div className="wordmark">News<span className="f">flow</span></div>
            <div className="stationery">
              <span className="status">
                <span className="dot" />&ensp;Feed live · {totalNew} new today
              </span>
              <span>Your morning brief</span>
            </div>
          </header>

          <div className="substrip">
            <span>Signal over noise</span>
            <span className="motto">&ldquo;All the news that fits your day.&rdquo;</span>
            <span className="right">Est. 2026 · Made for one reader</span>
          </div>

          {/* ── GREETING + READING CARD ──────────────────── */}
          <section className="greeting-row">
            <div>
              <div className="greeting">
                {getGreeting()},&ensp;
                <span className="hl">reader.</span>
                <br />
                Your feed has&ensp;<em>{totalNew} stories</em>&ensp;
                across&ensp;<em>{COL_CATS.length + 2} desks</em>
                &ensp;— one of them deserves&ensp;
                <em>your full attention today.</em>
              </div>
            </div>
            <aside className="reading-card">
              <div className="lbl">
                <span>Today&apos;s Reading Brief</span>
                <b>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</b>
              </div>
              <div className="stats">
                <div className="stat">
                  <div className="n">{totalNew}</div>
                  <div className="k">New stories</div>
                </div>
                <div className="stat">
                  <div className="n">{readingMin}<sup>min</sup></div>
                  <div className="k">Est. to read</div>
                </div>
                <div className="stat">
                  <div className="n">{savedCount}</div>
                  <div className="k">Saved</div>
                </div>
              </div>
              <div className="calibrate">
                <div className="txt">
                  <b>Personalised.</b> Rate articles with + / − to tune your feed.
                </div>
              </div>
              <div className="progress">
                <span style={{ width: `${progressPct}%` }} />
              </div>
            </aside>
          </section>

          {/* ── HERO STORY ───────────────────────────────── */}
          {hero && (
            <>
              <div className="section-head">
                <span className="kicker">Lead Story</span>
                <span className="rule" />
                <span className="meta-right">
                  {CATEGORY_LABELS[hero.category]} · {timeAgo(hero.published_at)}
                </span>
              </div>

              <article className="hero">
                <div className="hero-left">
                  <div className="hero-eyebrow">
                    <span>{CATEGORY_LABELS[hero.category]}</span>
                    <span className="dotb" />
                    <span>{hero.source}</span>
                    <span className="dotb" />
                    <span>{timeAgo(hero.published_at)}</span>
                  </div>
                  <h1 className="hero-title">{hero.title}</h1>
                  {hero.excerpt && (
                    <p className="hero-deck">{hero.excerpt}</p>
                  )}
                  <div className="byline">
                    <span className="src">{hero.source}</span>
                    <span className="sep" />
                    <span>{timeAgo(hero.published_at)}</span>
                  </div>
                  <div className="hero-actions">
                    <a
                      href={hero.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn primary"
                      onClick={() => markAsRead(hero.id)}
                    >
                      Read article&ensp;<span className="arr">→</span>
                    </a>
                    <button
                      className="btn"
                      onClick={() => handleSave(hero)}
                    >
                      {saves[hero.id] ? 'Saved ✓' : 'Save for later'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleSignal(hero.id, 'up')}
                    >
                      {signals[hero.id] === 'up' ? '＋ Liked' : 'More like this'}
                    </button>
                  </div>
                </div>

                <div className="hero-right">
                  {hero.ai_insight && (
                    <div className="why-box">
                      <p>{hero.ai_insight}</p>
                    </div>
                  )}
                  {/* Related: next 3 from same category */}
                  {(() => {
                    const related = articles
                      .filter((a) => a.id !== hero.id && a.category === hero.category)
                      .slice(0, 3)
                    if (!related.length) return null
                    return (
                      <div className="related">
                        <div className="rh">Related threads</div>
                        {related.map((rel, i) => (
                          <a
                            key={rel.id}
                            className="rel-item"
                            href={rel.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsRead(rel.id)}
                          >
                            <div className="num">{['i.', 'ii.', 'iii.'][i]}</div>
                            <div>
                              <div className="t">{rel.title}</div>
                              <div className="m">{rel.source} · {timeAgo(rel.published_at)}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </article>
            </>
          )}

          {/* ── EDITORIAL SPREAD ─────────────────────────── */}
          <div className="section-head">
            <span className="kicker o">The Spread</span>
            <span className="rule" />
            <span className="meta-right">Mixed categories</span>
          </div>

          <section className="spread">
            {COL_CATS.map((cat) => (
              <div key={cat} className="col">
                <div className="col-head">
                  <span className="t">{COL_LABELS[cat]}</span>
                  <span className="c">{colArticles[cat].length} stories</span>
                </div>
                {colArticles[cat].length === 0 && (
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    No stories yet — check back soon.
                  </p>
                )}
                {colArticles[cat].map((a, idx) => {
                  const isFirst = idx === 0
                  const stamp = isFirst ? 'FRESH' : (a.preference_score ?? 0) > 0.7 ? 'HOT' : null
                  return (
                    <article
                      key={a.id}
                      className={`story${stamp ? ' stamped' : ''}`}
                      data-stamp={stamp ?? undefined}
                    >
                      <div className="src">
                        <span className="t">{a.source}</span>
                        <span>{timeAgo(a.published_at)}</span>
                      </div>
                      <h3
                        onClick={() => {
                          window.open(a.url, '_blank', 'noopener,noreferrer')
                          markAsRead(a.id)
                        }}
                      >
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p>
                          {a.excerpt.length > 130
                            ? a.excerpt.slice(0, 130) + '…'
                            : a.excerpt}
                        </p>
                      )}
                      <div className="foot">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markAsRead(a.id)}
                        >
                          Read →
                        </a>
                        <div className="margin-notes">
                          <button
                            className={`mnote${signals[a.id] === 'up' ? ' on-up' : ''}`}
                            onClick={() => handleSignal(a.id, 'up')}
                            title="Interesting"
                          >＋</button>
                          <button
                            className={`mnote${signals[a.id] === 'down' ? ' on-down' : ''}`}
                            onClick={() => handleSignal(a.id, 'down')}
                            title="Skip"
                          >−</button>
                          <button
                            className={`mnote${saves[a.id] ? ' on-save' : ''}`}
                            onClick={() => handleSave(a)}
                          >
                            {saves[a.id] ? 'Saved' : 'Save'}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ))}
          </section>

          {/* ── READING RIBBON ───────────────────────────── */}
          {ribbonArticles.length > 0 && (
            <>
              <div className="section-head">
                <span className="kicker">Also today</span>
                <span className="rule" />
                <span className="meta-right">← scroll · {ribbonArticles.length} clips</span>
              </div>
              <section className="ribbon-wrap">
                <div className="ribbon-scroll">
                  {ribbonArticles.slice(0, 14).map((a) => (
                    <a
                      key={a.id}
                      className="clip"
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => markAsRead(a.id)}
                    >
                      <div className="t">
                        <b>{a.source}</b>
                        <span>{timeAgo(a.published_at)}</span>
                      </div>
                      <h4>{a.title}</h4>
                      <div className="tag">{CATEGORY_LABELS[a.category]}</div>
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ── FOOTER ───────────────────────────────────── */}
          <div className="edition-footer">
            <span>— End of today&apos;s edition —</span>
            <span>Refreshes every 60s</span>
            <span>Newsflow · {new Date().getFullYear()}</span>
          </div>

        </div>
      )}

      {/* ── TOOLBAR ──────────────────────────────────────── */}
      <div className="toolbar">
        <div className="me">N</div>
        <button
          className={`tab${activeTab === 'news' ? ' active' : ''}`}
          onClick={() => onTabChange('news')}
        >
          Today
        </button>
        <button
          className={`tab${activeTab === 'saved' ? ' active' : ''}`}
          onClick={() => onTabChange('saved')}
        >
          Saved&ensp;·&ensp;{savedCount}
        </button>
        <button
          className={`tab${activeTab === 'others' ? ' active' : ''}`}
          onClick={() => onTabChange('others')}
        >
          Feeds
        </button>
        <div className="tsep" />
        <form action={logout} style={{ margin: 0 }}>
          <button type="submit" className="tab">Sign out</button>
        </form>
      </div>
    </div>
  )
}
