'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { submitPublicConsent } from '@/app/actions/publicSubmissions'
import { CONSENT_TYPES, CONSENT_TYPE_LABEL, type ConsentType } from '@/lib/types'

type State = { error?: string }

/**
 * Plain-language explanation of each consent, in the customer's terms rather
 * than the internal `CONSENT_TYPE_LABEL` shorthand. The customer is agreeing to
 * the thing described here, so this wording has to say what actually happens.
 */
const CONSENT_EXPLANATION: Record<ConsentType, string> = {
  BUREAU_PULL: 'We’ll check your credit bureau report to assess this application.',
  LENDER_DATA_SHARING: 'Your application details may be shared with lenders on our panel to get you offers.',
  MARKETING: 'We may contact you about other products and offers.',
}

/**
 * The customer-facing consent form.
 *
 * No item carries a default choice: an unanswered item blocks submission rather
 * than being read as a refusal, exactly as `recordConsent` treats a missing
 * decision. The link is not single-use — within its window the customer may
 * come back and answer differently, and that records fresh rows rather than
 * editing the old ones, so the trail shows they changed their mind.
 */
export function PublicConsentForm({
  token, displayName, latestByType,
}: {
  token: string
  displayName: string
  latestByType: Partial<Record<ConsentType, { granted: boolean; captured_at: string }>>
}) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Partial<Record<ConsentType, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await submitPublicConsent(token, formData)
    if (!result?.error) {
      setSubmitted(true)
      setAnswers({})
      // Re-runs the server page so the "last recorded" lines reflect what was
      // just saved. The confirmation above survives, being client state.
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  const allAnswered = CONSENT_TYPES.every((t) => answers[t] !== undefined)

  return (
    <form action={formAction} className="rounded-[28px] bg-[#f7f6f4] px-5 py-5 elev">
      <p className="text-[14px] font-semibold text-[#16161a]">
        {displayName ? `Hello ${displayName},` : 'Hello,'}
      </p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-[#5f5d58]">
        Please tell us what you agree to. You can accept some and decline others — declining an item does not
        cancel your application, and you can come back to this link and change your answer while it is valid.
      </p>

      {submitted && (
        <p className="mt-4 flex items-start gap-2 rounded-[20px] bg-[#e8f3ee] px-4 py-3 text-[12.5px] font-medium leading-relaxed text-[#16694a]">
          <Check size={15} className="mt-px shrink-0" />
          Thank you — your response has been recorded.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {CONSENT_TYPES.map((t) => {
          const previous = latestByType[t]
          return (
            <fieldset key={t} className="rounded-[20px] bg-[#efeeeb]/70 px-4 py-3.5">
              <legend className="sr-only">{CONSENT_TYPE_LABEL[t]}</legend>
              <p className="text-[12.5px] font-semibold text-[#16161a]">{CONSENT_TYPE_LABEL[t]}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#5f5d58]">{CONSENT_EXPLANATION[t]}</p>
              {previous && (
                <p className="mt-1.5 text-[11px] text-[#7c7a75]">
                  Last recorded: {previous.granted ? 'Accepted' : 'Declined'} on{' '}
                  {new Date(previous.captured_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
              <div className="mt-2.5 flex gap-2">
                <Choice
                  name={`consent_${t}`} value="true" label="Accept"
                  checked={answers[t] === true}
                  onChange={() => setAnswers((a) => ({ ...a, [t]: true }))}
                  tone="accept"
                />
                <Choice
                  name={`consent_${t}`} value="false" label="Decline"
                  checked={answers[t] === false}
                  onChange={() => setAnswers((a) => ({ ...a, [t]: false }))}
                  tone="decline"
                />
              </div>
            </fieldset>
          )
        })}
      </div>

      {state?.error && <p className="mt-3 text-[12px] text-[#b42318]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !allAnswered}
        title={allAnswered ? undefined : 'Answer all three items first'}
        className="mt-4 h-11 w-full rounded-full bg-[#2440e8] px-4 text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
      >
        {pending ? 'Submitting…' : submitted ? 'Submit again' : 'Submit my response'}
      </button>
      {!allAnswered && (
        <p className="mt-2 text-center text-[11px] text-[#7c7a75]">Choose Accept or Decline for all three items.</p>
      )}
    </form>
  )
}

/** A radio styled as a button. Radio rather than a toggle so that "unanswered"
 *  is a real, visible third state rather than an implied No. */
function Choice({
  name, value, label, checked, onChange, tone,
}: {
  name: string; value: string; label: string; checked: boolean
  onChange: () => void; tone: 'accept' | 'decline'
}) {
  const activeClass = tone === 'accept' ? 'bg-[#1a7f5a] text-white' : 'bg-[#b42318] text-white'
  return (
    <label
      className={`inline-flex h-10 flex-1 cursor-pointer items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors ${
        checked ? activeClass : 'bg-[#f7f6f4] text-[#5f5d58] hover:bg-[#e3e2de]'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  )
}
