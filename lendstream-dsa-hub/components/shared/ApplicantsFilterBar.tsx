'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

/**
 * Debounced, URL-driven search for the Applicants list — typing updates
 * `?q=` after a short pause rather than on every keystroke or only on Enter,
 * so the list filters live without a page navigation per character.
 */
export function ApplicantsFilterBar({ basePath, q, summary }: { basePath: string; q: string; summary: string }) {
  const router = useRouter()
  const [value, setValue] = useState(q)
  const first = useRef(true)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(() => {
      const trimmed = value.trim()
      router.replace(trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      <div className="relative w-full max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7a75]" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search name, mobile or email"
          className="w-full rounded-full border border-[#dcdbd6] bg-[#f7f6f4] py-2 pl-10 pr-4 text-[12.5px] text-[#1a1917] placeholder:text-[#7c7a75] focus:border-[#16161a] focus:outline-none"
        />
      </div>
      <span className="ml-auto text-[12px] text-[#7c7a75] tnum">{summary}</span>
    </div>
  )
}
