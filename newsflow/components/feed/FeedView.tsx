'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { getSavedArticles } from '@/lib/localStorage'
import { logout } from '@/app/actions/auth'
import styles from '@/components/feed/editorial.module.css'

const EditorialFeed = dynamic(() => import('@/components/feed/EditorialFeed'), { ssr: false })
const SavedPosts    = dynamic(() => import('@/components/saved/SavedPosts'),    { ssr: false })
const CustomFeeds   = dynamic(() => import('@/components/others/CustomFeeds'),  { ssr: false })

export type Tab = 'news' | 'saved' | 'others'

export default function FeedView() {
  const [activeTab,  setActiveTab]  = useState<Tab>('news')
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    function sync() { setSavedCount(getSavedArticles().length) }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setSavedCount(getSavedArticles().length)
  }

  if (activeTab === 'news') {
    return (
      <EditorialFeed
        activeTab={activeTab}
        onTabChange={handleTabChange}
        savedCount={savedCount}
      />
    )
  }

  /* ── Saved & Others share the same editorial toolbar ─────────── */
  return (
    <div className={styles.wrap}>
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=JetBrains+Mono:wght@400;500;600&family=Geist:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ paddingBottom: 64 }}>
        {activeTab === 'saved'  && <SavedPosts />}
        {activeTab === 'others' && <CustomFeeds />}
      </div>

      <div className="toolbar">
        <div className="me">N</div>
        <button
          className="tab"
          onClick={() => handleTabChange('news')}
        >Today</button>
        <button
          className={`tab${activeTab === 'saved'  ? ' active' : ''}`}
          onClick={() => handleTabChange('saved')}
        >Saved&ensp;·&ensp;{savedCount}</button>
        <button
          className={`tab${activeTab === 'others' ? ' active' : ''}`}
          onClick={() => handleTabChange('others')}
        >Feeds</button>
        <div className="tsep" />
        <form action={logout} style={{ margin: 0 }}>
          <button type="submit" className="tab">Sign out</button>
        </form>
      </div>
    </div>
  )
}
