'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

type State = { error?: string }

async function signupAction(_prevState: State, formData: FormData): Promise<State> {
  const result = await signup(formData)
  return result ?? {}
}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(signupAction, {})

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-xl font-semibold text-[#1a1917]">Partner sign up</h1>
      <p className="mb-6 text-sm text-[#7c7a75]">LendStream DSA Hub</p>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-[#5f5d58]" htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#5f5d58]" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#5f5d58]" htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-[#5f5d58]" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-[#e2e0da] px-3 py-2 text-sm focus:border-[#1a1917] focus:outline-none"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600" role="alert">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-[#1a1917] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#7c7a75]">
        Already a partner?{' '}
        <Link href="/login" className="font-medium text-[#1a1917]">Sign in</Link>
      </p>
    </main>
  )
}
