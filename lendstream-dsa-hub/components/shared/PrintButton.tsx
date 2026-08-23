'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-[#1a1917] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
    >
      Print / Save as PDF
    </button>
  )
}
