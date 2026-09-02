'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Phone, MessageCircle, Mail, MapPin, Building2, UsersRound, CalendarClock, Plus, X, History,
} from 'lucide-react'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { addApplicantInteraction } from '@/app/actions/applicantRelationship'
import type { ApplicantInteraction, ApplicantInteractionChannel } from '@/lib/types'

type State = { error?: string }

const CHANNELS: { key: ApplicantInteractionChannel; label: string; Icon: typeof Phone }[] = [
  { key: 'CALL', label: 'Call', Icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'EMAIL', label: 'Email', Icon: Mail },
  { key: 'FIELD_VISIT', label: 'Field visit', Icon: MapPin },
  { key: 'BRANCH_MEETING', label: 'Branch meeting', Icon: Building2 },
  { key: 'MEETING', label: 'Meeting', Icon: UsersRound },
]

const CHANNEL_META = new Map(CHANNELS.map((c) => [c.key as string, c]))

/**
 * Relationship touchpoints — deliberately a compact card, not a copy of the
 * per-application `ActivityPanel`. No Customer/Internal/Bank categories, no
 * disposition list, no filters and no side column: that panel owns one loan
 * file and needs all of it; this is one card among several on a dense page and
 * only records "we spoke to this person, here's what about".
 */
export function RelationshipActivityCard({
  applicantId, interactions, isOwn,
}: {
  applicantId: string
  interactions: ApplicantInteraction[]
  isOwn: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ApplicantInteractionChannel>('CALL')

  async function action(_prev: State, formData: FormData): Promise<State> {
    formData.set('channel', channel)
    const result = await addApplicantInteraction(applicantId, formData)
    if (!result?.error) {
      setOpen(false)
      setChannel('CALL')
      router.refresh()
    }
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  return (
    <Card>
      <CardHead
        title="Relationship activity"
        sub="Touchpoints with the person — kept separate from each application's own Activity tab"
        icon={<History size={16} />}
        right={isOwn ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]"
          >
            {open ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Log a touchpoint</>}
          </button>
        ) : undefined}
      />
      <CardBody className="space-y-3">
        {isOwn && open && (
          <form action={formAction} className="space-y-2.5 rounded-[20px] bg-[#efeeeb]/60 p-3.5">
            <div className="flex flex-wrap gap-1.5">
              {CHANNELS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChannel(key)}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-semibold transition-colors ${
                    channel === key ? 'bg-[#1a1917] text-white' : 'bg-[#efeeeb] text-[#5f5d58] hover:bg-[#e3e2de]'
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
            <textarea
              name="note"
              rows={2}
              placeholder="What was discussed — keep it factual."
              className="w-full resize-y rounded-lg bg-[#efeeeb] px-3 py-2 text-[12.5px] text-[#16161a] placeholder:text-[#a8a6a0]"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10.5px] font-semibold uppercase tracking-wide text-[#7c7a75]">Next follow-up</label>
              <input type="date" name="next_follow_up" className="h-9 rounded-lg bg-[#efeeeb] px-3 text-[12.5px] text-[#16161a]" />
              <button type="submit" disabled={pending} className="ml-auto h-9 rounded-full bg-[#1a1917] px-4 text-[12.5px] font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
            {state?.error && <p className="text-[12px] text-[#b42318]">{state.error}</p>}
          </form>
        )}

        {interactions.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-[#a8a6a0]">No relationship touchpoints logged yet.</p>
        ) : (
          <div className="divide-y divide-[#e7e6e2]">
            {interactions.map((i) => {
              const meta = CHANNEL_META.get(i.channel)
              const Icon = meta?.Icon ?? History
              return (
                <div key={i.id} className="flex gap-3 py-2.5 first:pt-0">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#efeeeb] text-[#5f5d58]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[12.5px] font-semibold text-[#16161a]">{meta?.label ?? i.channel}</span>
                      <span className="text-[11px] text-[#7c7a75] tnum">
                        {new Date(i.occurred_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {i.note && <p className="mt-1 text-[12px] leading-relaxed text-[#5f5d58]">{i.note}</p>}
                    {i.next_follow_up && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#2440e8]">
                        <CalendarClock size={13} />
                        Follow-up {new Date(i.next_follow_up).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
