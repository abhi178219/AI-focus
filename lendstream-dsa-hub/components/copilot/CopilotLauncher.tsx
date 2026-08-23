'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sparkles, X } from 'lucide-react'
import { CopilotPanel } from './CopilotPanel'

export function CopilotLauncher() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const leadMatch = pathname.match(/\/leads\/([0-9a-f-]{36})/)
  const activeLeadId = leadMatch ? leadMatch[1] : null

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close AI Copilot' : 'Open AI Copilot'}
        aria-label={open ? 'Close AI Copilot' : 'Open AI Copilot'}
        className="fixed bottom-5 left-3 z-50 flex items-center gap-2.5 rounded-full bg-[#1a1917] px-4 py-2.5 text-white shadow-lg hover:opacity-90"
      >
        {open ? <X size={16} /> : <Sparkles size={16} />}
        <span className="text-left leading-tight">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">AI Copilot</span>
          <span className="block text-[13px] font-medium">gemma3:4b</span>
        </span>
      </button>
      {open && <CopilotPanel activeLeadId={activeLeadId} onClose={() => setOpen(false)} />}
    </>
  )
}
