'use client'

import { Suspense, useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'

type State = { error?: string }

async function loginAction(_prevState: State, formData: FormData): Promise<State> {
  const result = await login(formData)
  return result ?? {}
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? ''
  const [state, formAction, pending] = useActionState<State, FormData>(loginAction, {})

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-xl font-semibold text-[#1a1917]">Sign in</h1>
      <p className="mb-6 text-sm text-[#7c7a75]">LendStream DSA Hub</p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirect} />
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
          <label className="mb-1 block text-sm font-medium text-[#5f5d58]" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
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
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-[#7c7a75]">
        New partner?{' '}
        <Link href="/signup" className="font-medium text-[#1a1917]">Create an account</Link>
      </p>
    </main>
  )
}
