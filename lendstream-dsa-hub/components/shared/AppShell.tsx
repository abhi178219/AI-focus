'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Bell, ChartColumn, ChevronDown, LayoutGrid, LifeBuoy, ListChecks, LogOut,
  Search, ShieldCheck, Sparkles, Users, Wallet,
} from 'lucide-react'
import { CopilotLauncher } from '@/components/copilot/CopilotLauncher'
import { logout } from '@/app/actions/auth'

/** Single portal — the prototype's five, plus Tasks/Policy added after. */
const NAV_ITEMS = [
  { href: '/partner', label: 'Dashboard', icon: LayoutGrid },
  { href: '/partner/leads', label: 'Leads', icon: Users },
  { href: '/partner/calculators', label: 'Calculators', icon: ChartColumn },
  { href: '/partner/analytics', label: 'Analytics', icon: Wallet },
  { href: '/partner/products', label: 'Products', icon: LifeBuoy },
  { href: '/partner/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/partner/policy', label: 'Policy', icon: ShieldCheck },
] as const

export function AppShell({
  userName,
  userSubtitle,
  children,
}: {
  userName: string
  userSubtitle: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = NAV_ITEMS
  const initials = userName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const q = e.currentTarget.value.trim()
    router.push(q ? `/partner/leads?q=${encodeURIComponent(q)}` : '/partner/leads')
  }

  return (
    <div className="min-h-screen bg-[#eae9e6]">
      <aside data-app-shell-chrome className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col items-center py-5 lg:flex">
        <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16161a] text-white">
          <Sparkles size={20} />
        </div>
        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {navItems.map((item) => {
            const active = item.href === '/partner'
              ? pathname === item.href
              : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                  active ? 'bg-[#16161a] text-white' : 'text-[#7c7a75] hover:bg-[#efeeeb] hover:text-[#16161a]'
                }`}
              >
                <Icon size={19} />
              </Link>
            )
          })}
        </nav>
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl text-[#c9c7c1]" title="Settings (not yet built)">
          <SettingsIcon />
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[84px]">
        <header data-app-shell-chrome className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-[#eae9e6]/85 px-5 backdrop-blur-md lg:px-7">
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7c7a75]" />
            <input
              placeholder="Search name, mobile, PAN or lead ID"
              onKeyDown={handleSearchKeyDown}
              className="w-full rounded-full bg-[#efeeeb] py-2.5 pl-11 pr-4 text-[13px] text-[#1a1917] placeholder:text-[#7c7a75] focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#5f5d58] hover:bg-[#efeeeb]" title="Notifications" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full bg-[#2440e8] ring-2 ring-[#eae9e6]" />
            </button>
            {/* The prototype is a static mockup with no auth, so it shows no
                sign-out. This app has real sessions — the control lives behind
                the avatar so the header still matches while staying usable. */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-10 items-center gap-2.5 rounded-full bg-[#efeeeb] pl-1 pr-3 hover:bg-[#e3e2de]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e3e2de] text-xs font-semibold text-[#16161a]">
                  {initials}
                </div>
                <div className="min-w-0 text-left text-sm leading-tight">
                  <div className="truncate text-[12px] font-semibold text-[#16161a]">{userName}</div>
                  <div className="truncate text-[10.5px] text-[#7c7a75]">{userSubtitle}</div>
                </div>
                <ChevronDown size={14} className="text-[#7c7a75]" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                  <div role="menu" className="absolute right-0 top-[calc(100%+6px)] z-20 w-44 rounded-2xl bg-white p-1.5 shadow-md">
                    <form action={logout}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-medium text-[#47453f] hover:bg-[#f7f6f4]"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto min-w-0 max-w-[1560px] px-4 pb-10 lg:px-7">{children}</main>
      </div>

      <div data-app-shell-chrome>
        <CopilotLauncher />
      </div>
    </div>
  )
}

function SettingsIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
