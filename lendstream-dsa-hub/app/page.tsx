import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-[#1a1917]">LendStream DSA Hub</h1>
        <p className="mt-2 text-[#7c7a75]">Partner portal for loan leads, documents, and AI-assisted eligibility assessment.</p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="rounded-full bg-[#1a1917] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90">
          Log in
        </Link>
        <Link href="/signup" className="rounded-full border border-[#e2e0da] px-5 py-2.5 text-sm font-medium text-[#5f5d58] hover:bg-[#f7f6f4]">
          Partner sign up
        </Link>
      </div>
    </main>
  )
}
