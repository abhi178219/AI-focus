'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/nav/BottomNav'
import { logout } from '@/app/actions/auth'

const BentoGrid = dynamic(() => import('@/components/feed/BentoGrid'), { ssr: false })
const SavedPosts = dynamic(() => import('@/components/saved/SavedPosts'), { ssr: false })
const CustomFeeds = dynamic(() => import('@/components/others/CustomFeeds'), { ssr: false })

export type Tab = 'news' | 'saved' | 'others'

const TAB_TITLES: Record<Tab, string> = {
  news: "Today's News",
  saved: 'Saved Posts',
  others: 'Others',
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>('news')

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-stone-900 tracking-tight">NewsFlow</h1>
            <span className="hidden sm:block text-xs text-stone-400 font-medium">
              {TAB_TITLES[activeTab]}
            </span>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded-lg hover:bg-stone-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 pt-5">
        {activeTab === 'news' && <BentoGrid />}
        {activeTab === 'saved' && <SavedPosts />}
        {activeTab === 'others' && <CustomFeeds />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
