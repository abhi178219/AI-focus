'use client'

import type { Tab } from '@/app/page'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'news', label: "Today's News", icon: '📰' },
  { id: 'saved', label: 'Saved', icon: '🔖' },
  { id: 'others', label: 'Others', icon: '➕' },
]

export default function BottomNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-stone-200">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-around h-16">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center gap-0.5 flex-1 py-1 transition-colors ${
              activeTab === id ? 'text-blue-600' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className={`text-xs font-medium ${activeTab === id ? 'text-blue-600' : ''}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  )
}
