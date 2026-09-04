import type { ReactNode } from 'react'
import { Info } from 'lucide-react'

/**
 * Small "i" glyph that reveals an explanation on hover (and on focus, for
 * keyboard users) — pure CSS group-hover, no JS state and no extra dependency,
 * consistent with this app's zero-extra-package UI layer.
 *
 * Use next to any label whose meaning isn't self-evident (DSCR, FOIR, LTV,
 * CoV, …) rather than next to every label — a tooltip on an obvious word is
 * noise, not help.
 */
export function InfoTooltip({ text, label }: { text: string; label?: string }) {
  return (
    <span className="group/tip relative inline-flex">
      <button
        type="button"
        tabIndex={0}
        aria-label={label ?? 'More information'}
        className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[#a8a6a0] outline-none hover:text-[#5f5d58] focus-visible:text-[#5f5d58]"
      >
        <Info size={13} strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 w-max max-w-[240px] -translate-x-1/2 scale-95 rounded-lg bg-[#1a1917] px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-[opacity,transform] duration-100 group-hover/tip:scale-100 group-hover/tip:opacity-100 group-focus-within/tip:scale-100 group-focus-within/tip:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[#1a1917]" />
      </span>
    </span>
  )
}

/** Label + info icon, for reuse anywhere a metric's uppercase label sits above its value. */
export function LabelWithTooltip({ children, tooltip }: { children: ReactNode; tooltip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <InfoTooltip text={tooltip} />
    </span>
  )
}
