'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { login, signup } from '@/app/actions/auth'
import styles from './landing.module.css'

type Mode = 'signin' | 'signup'

const horizontalFeeds: Record<string, Array<[string, string, string?]>> = {
  macro: [
    ['FOMC', 'Powell signals patience as core PCE holds at 2.6%', '+0.4%'],
    ['CPI', 'March print cools to 2.9%, rate-cut odds rebuild', '+0.2%'],
    ['ECB', 'Lagarde: disinflation path "well-advanced"', '+0.1%'],
    ['OIL', 'Brent $84.20 on Red Sea disruptions', '-1.1%'],
    ['JOBS', 'NFP +214k, unemployment 3.8%', '+0.3%'],
    ['BOJ', 'Yen intervention watch as USD/JPY nears 162', '-0.8%'],
    ['CHINA', 'Q1 GDP +5.3% y/y, beat', '+0.6%'],
  ],
  pm: [
    ['LINEAR', 'Initiatives rewrite ships — teardown inside'],
    ['FIGMA', 'Slides goes GA, pricing unchanged'],
    ['LAUNCH', 'Supabase adds cron + queues at no cost'],
    ['NOTION', 'Calendar acquires Sameplace team'],
    ['PRICING', 'Cursor rolls back "compute credits" model'],
    ['PLG', 'Loom usage-curve teardown: what changed at Atlassian'],
    ['STRIPE', 'Usage-based billing v3, adapters for every CDP'],
  ],
  startup: [
    ['RAISED', 'Mercor · $450M Series D · $3.2B', '$450M'],
    ['RAISED', 'Harvey · $100M Series C extension', '$100M'],
    ['EXIT', 'Granola acquired by ElevenLabs, terms undisclosed', 'M&A'],
    ['YC', 'W26 demo day: 212 companies, 41% deeptech', 'NEW'],
    ['IPO', 'Rubrik files S-1 amendment, range tightens', 'S-1'],
    ['SEED', 'Atmos · $12M led by Index on day-one revenue', '$12M'],
    ['DOWN', 'Getir winds down US ops, Turkey-only', 'DOWN'],
  ],
  tech: [
    ['AI', 'Claude Haiku 4.5 releases — latency down 38%'],
    ['INFRA', 'Cloudflare Workers ship durable GPUs'],
    ['DB', 'Postgres 18 async I/O benchmarks posted'],
    ['WEB', 'Chrome 129 drops third-party cookies (finally)'],
    ['DEV', 'Bun 2.0 hits stable — drop-in for Node?'],
    ['OSS', 'Zed editor goes open source, repo at 42k⭐'],
    ['API', 'OpenAI Realtime API adds voice cloning guardrails'],
  ],
}

const tagForKey: Record<string, string> = { macro: 'macro', pm: 'pm', startup: 'startup', tech: 'tech' }

function deltaClass(d?: string) {
  if (!d) return ''
  if (d.startsWith('+')) return 'delta-up'
  if (d.startsWith('-')) return 'delta-down'
  return ''
}

function mixedRow(keys: string[]) {
  const merged: Array<[string, string, string, string?]> = []
  for (const k of keys) {
    for (const item of horizontalFeeds[k]) {
      merged.push([k, item[0], item[1], item[2]])
    }
  }
  // deterministic shuffle using index based rotation to avoid hydration mismatch
  merged.sort((a, b) => (a[1] + a[2]).localeCompare(b[1] + b[2]))
  return merged
    .map(([key, label, headline, delta]) => {
      const dc = deltaClass(delta)
      const deltaHtml = delta ? ` · <span class="${dc}">${delta}</span>` : ''
      return `<span class="tk-item"><span class="tag ${tagForKey[key]}">${label}</span>${headline}${deltaHtml}<span class="sep">◆</span></span>`
    })
    .join('')
}

const indices: Array<[string, string, string, 'up' | 'dn']> = [
  ['S&P 500', '5,312.47', '+0.42%', 'up'],
  ['NASDAQ', '16,841.92', '+0.61%', 'up'],
  ['DOW', '39,748.55', '-0.08%', 'dn'],
  ['VIX', '14.02', '-3.12%', 'dn'],
  ['10Y YIELD', '4.268%', '+2bp', 'up'],
  ['BTC', '$68,412', '+1.84%', 'up'],
  ['ETH', '$3,421', '+2.05%', 'up'],
  ['USD/JPY', '161.84', '+0.22%', 'up'],
  ['EUR/USD', '1.0842', '-0.12%', 'dn'],
  ['OIL BRENT', '$84.20', '-1.10%', 'dn'],
  ['GOLD', '$2,392', '+0.38%', 'up'],
  ['NVDA', '$912.44', '-0.73%', 'dn'],
  ['AAPL', '$168.22', '+0.51%', 'up'],
  ['MSFT', '$421.08', '-1.22%', 'dn'],
  ['META', '$512.60', '-2.10%', 'dn'],
]

const vColItems = [
  { head: ['MACRO', '07:42 ET'], body: '<strong>Fed minutes: patience.</strong>Rate-cut odds for June rebuild to 46%.' },
  { head: ['STARTUPS', 'SFO'], body: '<strong>Mercor · Series D.</strong>$450M at $3.2B, Benchmark leads.' },
  { head: ['PM', 'MEMO'], body: '<strong>Linear Initiatives v2.</strong>The goodbye to "Projects" — full teardown.' },
  { head: ['TECH', 'RELEASE'], body: '<strong>Postgres 18.</strong>Async I/O lands, real-world benchmarks posted.' },
  { head: ['MACRO', 'FX'], body: '<strong>USD/JPY near 162.</strong>Intervention watch, MOF "closely monitoring."' },
  { head: ['STARTUPS', 'YC W26'], body: '<strong>Demo Day results.</strong>212 companies · 41% deeptech · full list.' },
  { head: ['PM', 'PRICING'], body: '<strong>Supabase year one.</strong>Usage-based billing, the real numbers.' },
  { head: ['TECH', 'AI'], body: '<strong>Claude Haiku 4.5.</strong>Latency down 38%, price unchanged.' },
  { head: ['MACRO', 'CHN'], body: '<strong>Q1 GDP +5.3%.</strong>Beats consensus, property still a drag.' },
  { head: ['STARTUPS', 'EXIT'], body: '<strong>Granola → ElevenLabs.</strong>All-stock, team joins voice product.' },
]

function buildVCol() {
  return vColItems
    .map(
      (x) => `
    <div class="tk-vitem">
      <div class="head"><span>${x.head[0]}</span><span>${x.head[1]}</span></div>
      ${x.body}
    </div>`
    )
    .join('')
}

export default function LandingPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('signin')
  const [clock, setClock] = useState('07:42:19 ET')
  const [locale, setLocale] = useState('NYC · 07:42 ET')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const cardGridRef = useRef<HTMLDivElement | null>(null)

  const rowA = useRef<HTMLDivElement | null>(null)
  const rowB = useRef<HTMLDivElement | null>(null)
  const rowC = useRef<HTMLDivElement | null>(null)
  const rowD = useRef<HTMLDivElement | null>(null)
  const rowE = useRef<HTMLDivElement | null>(null)
  const liveTrack = useRef<HTMLDivElement | null>(null)
  const ixTrack = useRef<HTMLDivElement | null>(null)
  const mmTrack = useRef<HTMLDivElement | null>(null)
  const colA = useRef<HTMLDivElement | null>(null)
  const colB = useRef<HTMLDivElement | null>(null)
  const colC = useRef<HTMLDivElement | null>(null)

  // Populate ticker content client-side (avoids SSR DOM manipulation)
  useEffect(() => {
    const a = mixedRow(['macro', 'pm', 'startup', 'tech'])
    const b = mixedRow(['tech', 'startup', 'macro', 'pm'])
    const c = mixedRow(['pm', 'tech', 'macro', 'startup'])
    const d = mixedRow(['startup', 'macro', 'tech', 'pm'])
    const e = mixedRow(['macro', 'tech', 'pm', 'startup'])
    const live = mixedRow(['macro', 'startup', 'tech', 'pm', 'startup', 'macro'])
    if (rowA.current) rowA.current.innerHTML = a + a
    if (rowB.current) rowB.current.innerHTML = b + b
    if (rowC.current) rowC.current.innerHTML = c + c
    if (rowD.current) rowD.current.innerHTML = d + d
    if (rowE.current) rowE.current.innerHTML = e + e
    if (liveTrack.current) liveTrack.current.innerHTML = live + live

    const ixHtml = indices
      .map(
        ([n, v, d, dir]) =>
          `<span class="ix"><strong>${n}</strong> <span class="v">${v}</span> <span class="d ${dir}">${d}</span></span>`
      )
      .join('<span style="opacity:0.25">│</span>')
    if (ixTrack.current)
      ixTrack.current.innerHTML =
        ixHtml + '<span style="opacity:0.25; padding:0 14px">│</span>' + ixHtml

    const mmPhrase = `<span>SIGNAL <em>over</em> NOISE</span><span>THE MORNING <em>TAPE</em></span><span>BUILT FOR <strong>PRODUCT MINDS</strong></span><span>NEWS <em>that</em> MATTERS</span>`
    if (mmTrack.current) mmTrack.current.innerHTML = mmPhrase + mmPhrase

    const vhtml = buildVCol()
    if (colA.current) colA.current.innerHTML = vhtml + vhtml
    if (colB.current) colB.current.innerHTML = vhtml + vhtml
    if (colC.current) colC.current.innerHTML = vhtml + vhtml
  }, [])

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ET`)
      setLocale(`NYC · ${pad(d.getHours())}:${pad(d.getMinutes())} ET`)
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [])

  // Tilt on hover
  useEffect(() => {
    const root = cardGridRef.current
    if (!root) return
    const cards = root.querySelectorAll<HTMLElement>('.tilt')
    const maxTilt = 8
    const handlers: Array<[HTMLElement, (e: MouseEvent) => void, () => void]> = []
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        const ry = (px - 0.5) * 2 * maxTilt
        const rx = -(py - 0.5) * 2 * maxTilt
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`
      }
      const onLeave = () => {
        card.style.transform = ''
      }
      card.addEventListener('mousemove', onMove)
      card.addEventListener('mouseleave', onLeave)
      handlers.push([card, onMove, onLeave])
    })
    return () => {
      handlers.forEach(([c, m, l]) => {
        c.removeEventListener('mousemove', m)
        c.removeEventListener('mouseleave', l)
      })
    }
  }, [])

  // Mount flag so portal only renders client-side
  useEffect(() => { setMounted(true) }, [])

  // Modal body-overflow lock + ESC close
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey) }
  }, [modalOpen])

  function openModal(which: Mode) {
    setError(null)
    setMode(which)
    setModalOpen(true)
  }

  // Handle form submission — login/signup server actions call redirect() on success
  // which throws a special Next.js error; we re-throw it so the router handles navigation.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      try {
        const result = mode === 'signin' ? await login(formData) : await signup(formData)
        // Only reaches here on error return (redirect() throws and never returns)
        if (result && 'error' in result && result.error) {
          setError(result.error)
        }
      } catch (err: unknown) {
        // Re-throw Next.js redirect errors so the router can navigate
        const digest = (err as { digest?: string })?.digest ?? ''
        if (digest.startsWith('NEXT_REDIRECT')) {
          router.push('/')
          router.refresh()
          return
        }
        setError('Something went wrong. Please try again.')
      }
    })
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
      />
      <div className={styles.wrap}>
        {/* Times Square ticker grid */}
        <div className="ticker-stage" aria-hidden="true">
          <div className="tk-row paper" style={{ top: '6%', ['--dur' as string]: '180s' }}>
            <div className="tk-track" ref={rowA} />
          </div>
          <div className="tk-row dark rev" style={{ top: '22%', ['--dur' as string]: '210s' }}>
            <div className="tk-track" ref={rowB} />
          </div>
          <div className="tk-row amber" style={{ top: '62%', ['--dur' as string]: '240s' }}>
            <div className="tk-track" ref={rowC} />
          </div>
          <div className="tk-row rev" style={{ bottom: '18%', ['--dur' as string]: '200s' }}>
            <div className="tk-track" ref={rowD} />
          </div>
          <div className="tk-row dark" style={{ bottom: '3%', ['--dur' as string]: '230s' }}>
            <div className="tk-track" ref={rowE} />
          </div>
          <div className="tk-col" style={{ left: '4%', ['--dur' as string]: '320s' }}>
            <div className="tk-vtrack" ref={colA} />
          </div>
          <div className="tk-col dark rev" style={{ right: '6%', ['--dur' as string]: '380s' }}>
            <div className="tk-vtrack" ref={colB} />
          </div>
          <div className="tk-col amber" style={{ left: '70%', ['--dur' as string]: '420s' }}>
            <div className="tk-vtrack" ref={colC} />
          </div>
        </div>

        <div className="page">
          <div className="index-bar" role="region" aria-label="Markets">
            <div className="ix-brand">◆ NEWSFLOW · TAPE</div>
            <div className="ix-scroll">
              <div className="ix-track" ref={ixTrack} />
            </div>
            <div className="ix-locale">{locale}</div>
          </div>

          <nav className="top">
            <div className="logo">
              <span className="dot" />
              News<i>flow</i>
            </div>
            <div className="nav-links">
              <a href="#">Feed</a>
              <a href="#">Macro</a>
              <a href="#">Product</a>
              <a href="#">Startups</a>
              <a href="#">Tech</a>
              <a href="#">Pricing</a>
            </div>
            <div className="nav-auth">
              <button className="btn btn-ghost" onClick={() => openModal('signin')}>
                Sign in
              </button>
              <button className="btn btn-solid" onClick={() => openModal('signup')}>
                Get started →
              </button>
            </div>
          </nav>

          <section className="hero">
            <span className="eyebrow">
              <span className="pip" />
              LIVE · 2,184 stories curated in the last hour
            </span>
            <h1 className="hero-title">
              Signal over <em>noise.</em>
            </h1>
            <p className="hero-sub">
              Newsflow is a personalized news engine built for product managers. Macro shifts, PM
              playbooks, the startup tape, and the code moving the internet — filtered through your
              taste, delivered every morning.
            </p>
            <div className="hero-cta">
              <button className="btn btn-amber" onClick={() => openModal('signup')}>
                Start free — curate my feed
              </button>
              <button className="btn btn-ghost" onClick={() => openModal('signin')}>
                I have an account
              </button>
            </div>
            <div className="hero-meta">
              <div className="stat">
                <strong>142</strong>
                <span>sources / day</span>
              </div>
              <div className="stat">
                <strong>9 min</strong>
                <span>avg. morning read</span>
              </div>
              <div className="stat">
                <strong>38k</strong>
                <span>product people onboard</span>
              </div>
              <div className="stat">
                <strong>Mon–Fri</strong>
                <span>7:00 local</span>
              </div>
            </div>
          </section>

          <div className="live-strip" style={{ maxWidth: 1320 }} role="region" aria-label="Live ticker">
            <div className="ls-label">
              <span className="pip" />
              LIVE
            </div>
            <div className="ls-scroll">
              <div className="tk-track" ref={liveTrack} />
            </div>
            <div className="ls-time">{clock}</div>
          </div>

          <section className="mega-marquee" aria-hidden="true">
            <div className="mm-track" ref={mmTrack} />
          </section>

          <section className="lead">
            <article className="lead-main">
              <span className="lead-kicker">● LEAD · TODAY&apos;S BRIEF</span>
              <h2>
                The quiet <em>unbundling</em> of the product manager role, in one chart.
              </h2>
              <p className="dek">
                Three years into the AI build cycle, PM job listings have fractured into six
                distinct subspecies — forward-deployed, model-native, GTM-first — and the comp
                bands have fractured with them. We read the last 14,000 JDs so you don&apos;t have
                to.
              </p>
              <div className="lead-footer">
                <span className="byline">
                  BY <strong>M. AOKI</strong> · 9 MIN READ
                </span>
                <span className="read">OPEN STORY →</span>
              </div>
            </article>
            <aside className="lead-side">
              <div className="brief amber">
                <span className="b-kicker">◆ INTRADAY · WATCHLIST</span>
                <h3>Mag 7 ex-NVDA down 1.4% on AI capex jitters</h3>
                <div className="spark">
                  <svg viewBox="0 0 200 44" preserveAspectRatio="none">
                    <path
                      d="M0 28 L14 22 L28 24 L42 18 L56 20 L70 14 L84 19 L98 10 L112 16 L126 12 L140 22 L154 18 L168 30 L182 26 L200 34"
                      fill="none"
                      stroke="#0B1220"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <circle cx="200" cy="34" r="3" fill="#0B1220" />
                  </svg>
                </div>
                <div className="b-copy" style={{ marginTop: 10 }}>
                  META −2.1% · GOOG −1.8% · MSFT −1.2% · AMZN −0.9%
                </div>
              </div>
              <div className="brief">
                <span className="b-kicker">▲ TRENDING · GITHUB</span>
                <h3>zed-industries / zed just crossed 42k stars</h3>
                <div className="spark">
                  <svg viewBox="0 0 200 44" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gspk" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(88% 0.22 122)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="oklch(88% 0.22 122)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 38 L16 34 L32 36 L48 30 L64 26 L80 28 L96 20 L112 22 L128 16 L144 18 L160 10 L176 12 L192 6 L200 4 L200 44 L0 44 Z"
                      fill="url(#gspk)"
                    />
                    <path
                      d="M0 38 L16 34 L32 36 L48 30 L64 26 L80 28 L96 20 L112 22 L128 16 L144 18 L160 10 L176 12 L192 6 L200 4"
                      fill="none"
                      stroke="oklch(88% 0.22 122)"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="b-copy" style={{ marginTop: 10, color: '#c6cbda' }}>
                  +3,104 stars this week · trending #1 in Rust
                </div>
              </div>
            </aside>
          </section>

          <section className="sections">
            <div className="sec-head">
              <h2>
                Your desks, <em>curated.</em>
              </h2>
              <div className="sec-meta">04 SECTIONS · UPDATED EVERY 12 MIN</div>
            </div>
            <div className="card-grid" ref={cardGridRef}>
              <article className="card macro tilt">
                <div className="card-top">
                  <span className="card-tag">Macro</span>
                  <span className="count">218 today</span>
                </div>
                <h3>Rates, FX, and the real economy.</h3>
                <p className="lede">
                  Central banks, labor prints, energy, and the macro tape — compressed into what
                  actually moves your roadmap.
                </p>
                <div className="headlines">
                  <div className="headline">
                    <span className="num">01</span>
                    <span>Fed minutes hint at longer pause as core PCE sticks</span>
                    <span className="delta delta-up">+0.4%</span>
                  </div>
                  <div className="headline">
                    <span className="num">02</span>
                    <span>EU PMI flips expansionary first time since &apos;24</span>
                    <span className="delta delta-up">▲</span>
                  </div>
                  <div className="headline">
                    <span className="num">03</span>
                    <span>Yen intervention chatter as USD/JPY breaches 162</span>
                    <span className="delta delta-down">▼</span>
                  </div>
                </div>
              </article>
              <article className="card pm tilt">
                <div className="card-top">
                  <span className="card-tag">Product</span>
                  <span className="count">94 today</span>
                </div>
                <h3>PM craft &amp; playbooks.</h3>
                <p className="lede">
                  Launches, pricing experiments, PLG teardowns, and hard-won lessons from product
                  leaders — no guru slop.
                </p>
                <div className="headlines">
                  <div className="headline">
                    <span className="num">01</span>
                    <span>Linear&apos;s new &quot;Initiatives&quot; rewrite, annotated</span>
                    <span className="delta">READ</span>
                  </div>
                  <div className="headline">
                    <span className="num">02</span>
                    <span>Pricing teardown: usage-based at Supabase, one year in</span>
                    <span className="delta">LONG</span>
                  </div>
                  <div className="headline">
                    <span className="num">03</span>
                    <span>Why Figma killed its own &quot;AI Make&quot; — a PM memo</span>
                    <span className="delta">HOT</span>
                  </div>
                </div>
              </article>
              <article className="card startup tilt">
                <div className="card-top">
                  <span className="card-tag">Startups</span>
                  <span className="count">312 today</span>
                </div>
                <h3>The deal tape.</h3>
                <p className="lede">
                  Rounds, exits, hiring signals, and the quiet pivots — everything interesting out
                  of YC, a16z, and the long tail.
                </p>
                <div className="headlines">
                  <div className="headline">
                    <span className="num">01</span>
                    <span>Mercor raises $450M Series D at $3.2B</span>
                    <span className="delta delta-up">$450M</span>
                  </div>
                  <div className="headline">
                    <span className="num">02</span>
                    <span>Perplexity Enterprise doubles ARR in Q1</span>
                    <span className="delta delta-up">2×</span>
                  </div>
                  <div className="headline">
                    <span className="num">03</span>
                    <span>Rippling-Deel: new chapter, same lawyers</span>
                    <span className="delta">FILED</span>
                  </div>
                </div>
              </article>
              <article className="card tech tilt">
                <div className="card-top">
                  <span className="card-tag">Tech</span>
                  <span className="count">401 today</span>
                </div>
                <h3>Infra, AI &amp; the open web.</h3>
                <p className="lede">
                  Models, tooling, release notes that matter, and the frameworks your engineers
                  will be arguing about next week.
                </p>
                <div className="headlines">
                  <div className="headline">
                    <span className="num">01</span>
                    <span>Claude Haiku 4.5 vs GPT-4.1 mini: latency benchmarks</span>
                    <span className="delta">BENCH</span>
                  </div>
                  <div className="headline">
                    <span className="num">02</span>
                    <span>Cloudflare Workers now support durable GPUs</span>
                    <span className="delta delta-up">SHIP</span>
                  </div>
                  <div className="headline">
                    <span className="num">03</span>
                    <span>Postgres 18 lands async I/O — real numbers inside</span>
                    <span className="delta">NEW</span>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <section className="digest-section">
            <div className="digest-copy">
              <div className="d-kicker">◆ THE 7 A.M. DIGEST</div>
              <h2>
                One email. <em>Nine minutes.</em> Everything that moved.
              </h2>
              <p>
                Every weekday at 7 a.m. local, we compress the tape into a single,
                ruthlessly-edited digest. No autoplay. No push notifications. Just the things a
                product mind needs to know before stand-up.
              </p>
              <ul className="dlist">
                <li>
                  <span className="k">1</span>TOP-OF-FEED: the single story that matters most today
                </li>
                <li>
                  <span className="k">2</span>DESK RECAP: 3 bullets per desk, ranked by your taste
                </li>
                <li>
                  <span className="k">3</span>THE TAPE: markets, raises, ships — one line each
                </li>
                <li>
                  <span className="k">4</span>ONE LONG READ: hand-picked, under 12 min
                </li>
              </ul>
              <button
                className="btn btn-amber"
                onClick={() => openModal('signup')}
                style={{ padding: '13px 22px', fontSize: 14 }}
              >
                Get tomorrow&apos;s digest →
              </button>
            </div>

            <div className="email" aria-hidden="true">
              <div className="e-chrome">
                <span className="dot3">
                  <i />
                  <i />
                  <i />
                </span>
                NEWSFLOW / DIGEST · WED 22 APR · 07:00 ET
              </div>
              <div className="e-body">
                <div className="e-from">
                  FROM <strong>Newsflow</strong> · TO <strong>you@company.com</strong>
                </div>
                <div className="e-subject">
                  Your 9-minute <em>morning tape</em> — Wed, Apr 22
                </div>
                <div className="e-row">
                  <span className="e-tag macro">MACRO</span>
                  <span>
                    <strong>Fed minutes:</strong> Powell signals patience; June cut odds rebuild to
                    46%. Core PCE sticks at 2.6%.
                  </span>
                </div>
                <div className="e-row">
                  <span className="e-tag pm">PRODUCT</span>
                  <span>
                    <strong>Linear Initiatives v2</strong> ships — annotated teardown of what
                    replaces &quot;Projects&quot; and why.
                  </span>
                </div>
                <div className="e-row">
                  <span className="e-tag startup">STARTUPS</span>
                  <span>
                    <strong>Mercor · $450M Series D</strong> at $3.2B led by Benchmark. Six data
                    points from the deck.
                  </span>
                </div>
                <div className="e-row">
                  <span className="e-tag tech">TECH</span>
                  <span>
                    <strong>Postgres 18</strong> lands async I/O — real-world benchmarks from the
                    Supabase team.
                  </span>
                </div>
                <div className="e-row">
                  <span className="e-tag macro">LONG READ</span>
                  <span>
                    <strong>The quiet unbundling</strong> of the PM role — 14,000 JDs analyzed. 11
                    min.
                  </span>
                </div>
                <div className="e-end">
                  <span>UNSUBSCRIBE · MUTE A DESK</span>
                  <span>No. 482</span>
                </div>
              </div>
            </div>
          </section>

          <footer>
            <div>
              <div className="foot-logo">Newsflow</div>
              <div style={{ marginTop: 6 }}>SIGNAL OVER NOISE · EST. 2026</div>
            </div>
            <div className="cols">
              <div className="col">
                <strong>Product</strong>
                <a href="#">Feed</a>
                <a href="#">Digest</a>
                <a href="#">API</a>
              </div>
              <div className="col">
                <strong>Desks</strong>
                <a href="#">Macro</a>
                <a href="#">Product</a>
                <a href="#">Startups</a>
                <a href="#">Tech</a>
              </div>
              <div className="col">
                <strong>Company</strong>
                <a href="#">About</a>
                <a href="#">Careers</a>
                <a href="#">Contact</a>
              </div>
            </div>
          </footer>
        </div>

      </div>

      {/* Auth Modal — rendered into document.body via portal to avoid stacking-context issues */}
      {mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(11,18,32,0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: modalOpen ? 1 : 0,
            pointerEvents: modalOpen ? 'auto' : 'none',
            transition: 'opacity 0.28s ease',
          }}
        >
          <div style={{
            width: 'min(440px, 92vw)',
            background: '#F1E9D2',
            border: '1px solid #0B1220',
            borderRadius: 12,
            padding: '34px 34px 30px',
            position: 'relative',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.45)',
            transform: modalOpen ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
            transition: 'transform 0.3s cubic-bezier(.2,.7,.2,1)',
            color: '#0B1220',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            {/* Close */}
            <button
              aria-label="Close"
              onClick={() => setModalOpen(false)}
              type="button"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 28, height: 28, borderRadius: '50%',
                border: '1px solid rgba(20,19,16,0.15)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: '#0B1220',
              }}
            >✕</button>

            {/* Eyebrow */}
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
              color: '#0B1220', background: 'oklch(88% 0.22 122)',
              display: 'inline-block', padding: '4px 8px', borderRadius: 3,
              marginBottom: 14, fontWeight: 700,
            }}>NEWSFLOW · MEMBER ACCESS</div>

            {/* Title */}
            <h2 style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400, fontSize: 38, lineHeight: 1,
              letterSpacing: '-0.02em', margin: '0 0 8px', color: '#0B1220',
            }}>
              {mode === 'signin' ? 'Welcome back.' : 'Tune your feed.'}
            </h2>
            <p style={{ fontSize: 13.5, color: '#1B2236', margin: '0 0 22px' }}>
              {mode === 'signin' ? 'Sign in to your curated desk.' : 'Two minutes to your first morning digest.'}
            </p>

            {/* Tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              background: 'rgba(20,19,16,0.06)', borderRadius: 8,
              padding: 4, marginBottom: 22,
            }}>
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setError(null) }}
                  style={{
                    background: mode === m ? '#0B1220' : 'transparent',
                    border: 0, padding: '9px 10px',
                    fontFamily: "'Inter', sans-serif", fontSize: 12.5, fontWeight: 600,
                    color: mode === m ? '#F1E9D2' : '#1B2236',
                    cursor: 'pointer', borderRadius: 6,
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {mode === 'signup' && (
                <ModalField label="Full name">
                  <input type="text" name="name" placeholder="Ada Lovelace" autoComplete="name" style={inputStyle} />
                </ModalField>
              )}
              <ModalField label="Work email">
                <input type="email" name="email" placeholder="ada@company.com" autoComplete="email" required style={inputStyle} />
              </ModalField>
              <ModalField label="Password">
                <input
                  type="password" name="password" placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required minLength={8} style={inputStyle}
                />
                {mode === 'signup' && <span style={{ fontSize: 11, color: '#7C8699' }}>Minimum 8 characters.</span>}
              </ModalField>
              {mode === 'signup' && (
                <ModalField label="Your role">
                  <input type="text" name="role" placeholder="Senior PM, Platform" style={inputStyle} />
                </ModalField>
              )}

              {error && (
                <div style={{ color: 'oklch(66% 0.23 22)', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                style={{
                  width: '100%', padding: 13, fontSize: 14, marginTop: 6,
                  background: '#0B1220', color: '#F1E9D2',
                  border: '1px solid transparent', borderRadius: 6,
                  fontFamily: "'Inter', sans-serif", fontWeight: 600,
                  cursor: pending ? 'not-allowed' : 'pointer',
                  opacity: pending ? 0.7 : 1,
                  transition: 'all 0.15s ease',
                }}
              >
                {pending ? 'Working…' : mode === 'signin' ? 'Sign in →' : 'Create my account →'}
              </button>

              <div style={{ fontSize: 11, color: '#7C8699', textAlign: 'center', marginTop: 14 }}>
                {mode === 'signin' ? (
                  <>Don&apos;t have an account?{' '}
                    <span onClick={() => { setMode('signup'); setError(null) }} style={{ color: '#0B1220', cursor: 'pointer', textDecoration: 'underline' }}>Create one.</span>
                  </>
                ) : (
                  <>Already a member?{' '}
                    <span onClick={() => { setMode('signin'); setError(null) }} style={{ color: '#0B1220', cursor: 'pointer', textDecoration: 'underline' }}>Sign in.</span>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

/* Small helper components */
const inputStyle: React.CSSProperties = {
  border: '1px solid rgba(20,19,16,0.2)',
  borderRadius: 6, padding: '11px 13px', fontSize: 14,
  fontFamily: "'Inter', sans-serif", background: '#fff', color: '#0B1220',
  outline: 'none', width: '100%',
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <label style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C8699',
      }}>{label}</label>
      {children}
    </div>
  )
}
