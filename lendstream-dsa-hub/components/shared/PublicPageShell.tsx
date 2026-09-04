import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'

/**
 * Chrome for the two customer-facing pages (/consent/[token], /upload/[token]).
 *
 * Deliberately NOT `AppShell`: these are standalone pages for someone who has
 * no account, no session and no business seeing the partner portal's sidebar,
 * navigation or any other file. Just the app's own design tokens — canvas
 * #eae9e6, card #f7f6f4, ink #16161a/#5f5d58/#7c7a75, brand #2440e8 — in a
 * single centred column.
 */
export function PublicPageShell({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">LendStream</p>
        <h1 className="mt-1 text-[20px] font-semibold leading-tight text-[#16161a]">{title}</h1>
        {sub && <p className="mt-1.5 text-[13px] leading-relaxed text-[#5f5d58]">{sub}</p>}
      </div>
      {children}
      <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-[#7c7a75]">
        <ShieldCheck size={14} className="mt-px shrink-0" />
        This is a private link created for you by your relationship manager. It stops working after seven days.
      </p>
    </main>
  )
}

/**
 * The one thing a bad token ever produces. No detail about whether it was
 * unknown, expired, or issued for the other flow, and nothing that would help
 * someone guess a working one — just an honest dead end and who to ask.
 */
export function InvalidLinkCard() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">LendStream</p>
      <div className="mt-3 rounded-[28px] bg-[#f7f6f4] px-6 py-8 elev">
        <h1 className="text-[17px] font-semibold text-[#16161a]">This link is invalid or has expired.</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#5f5d58]">
          Ask your relationship manager for a new one.
        </p>
      </div>
    </main>
  )
}
