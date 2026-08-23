'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Phone, MessageCircle, Mail, MapPin, Building2, Plus, X, CalendarClock, History,
} from 'lucide-react'
import { addInteraction } from '@/app/actions/leads'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { KeyValueRow } from '@/components/shared/StatTile'
import type { Lead } from '@/lib/types'

/** Channels a user can log, in the prototype's order. */
const CHANNELS = [
  { key: 'CALL', label: 'Call', Icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'EMAIL', label: 'Email', Icon: Mail },
  { key: 'FIELD_VISIT', label: 'Field visit', Icon: MapPin },
  { key: 'BRANCH_MEETING', label: 'Branch meeting', Icon: Building2 },
] as const

/** STAGE_CHANGE is written by the stage picker, never logged by hand. */
const CHANNEL_META: Record<string, { label: string; Icon: typeof Phone }> = {
  ...Object.fromEntries(CHANNELS.map((c) => [c.key, { label: c.label, Icon: c.Icon }])),
  STAGE_CHANGE: { label: 'Stage change', Icon: History },
}

/** The prototype's disposition list, verbatim. */
const DISPOSITIONS = [
  'Interested — hot lead',
  'Documents pending',
  'Follow-up scheduled',
  'Field visit verified',
  'Query resolved',
  'Negotiating on rate',
  'Not reachable',
  'Not interested',
]

export interface ActivityRow {
  id: string
  channel: string
  outcome: string | null
  note: string | null
  occurred_at: string
  next_follow_up: string | null
  by: string | null
}

export function ActivityPanel({
  leadId, lead, interactions, ownerName,
}: {
  leadId: string
  lead: Lead
  interactions: ActivityRow[]
  ownerName: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<string>('CALL')
  const [disposition, setDisposition] = useState(DISPOSITIONS[0])
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const rows = useMemo(
    () => (filter === 'ALL' ? interactions : interactions.filter((i) => i.channel === filter)),
    [interactions, filter],
  )

  function save() {
    if (!note.trim()) {
      setError('Add a short summary of what was discussed.')
      return
    }
    setError(null)
    const fd = new FormData()
    fd.set('channel', channel)
    fd.set('outcome', disposition)
    fd.set('note', note.trim())
    if (followUp) fd.set('next_follow_up', followUp)
    startTransition(async () => {
      const result = await addInteraction(leadId, fd)
      if (result?.error) { setError(result.error); return }
      setNote('')
      setFollowUp('')
      setOpen(false)
      router.refresh()
    })
  }

  function openWith(next: string) {
    setChannel(next)
    setOpen(true)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHead
            title="Log an interaction"
            sub="Record every touchpoint — it drives the follow-up engine"
            icon={<History size={16} />}
            right={
              open ? (
                <button type="button" onClick={() => setOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
                  <X size={14} /> Cancel
                </button>
              ) : (
                <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1a1917] px-3.5 text-[12px] font-semibold text-white hover:opacity-90">
                  <Plus size={14} /> Log interaction
                </button>
              )
            }
          />
          {open && (
            <CardBody className="space-y-3.5">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Channel</p>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setChannel(key)}
                      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12px] font-semibold transition-colors ${
                        channel === key ? 'bg-[#1a1917] text-white' : 'bg-[#efeeeb] text-[#5f5d58] hover:bg-[#e3e2de]'
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Outcome</p>
                  <select
                    value={disposition}
                    onChange={(e) => setDisposition(e.target.value)}
                    className="h-9 w-full rounded-lg bg-[#efeeeb] px-3 text-[13px] text-[#16161a]"
                  >
                    {DISPOSITIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Next follow-up</p>
                  <input
                    type="date"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    className="h-9 w-full rounded-lg bg-[#efeeeb] px-3 text-[13px] text-[#16161a]"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">What was discussed</p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Keep it factual — what the customer said, what was agreed, what is outstanding."
                  className="w-full resize-y rounded-lg bg-[#efeeeb] px-3 py-2.5 text-[13px] text-[#16161a] placeholder:text-[#a8a6a0]"
                />
              </div>

              {error && <p className="text-[12px] text-[#b42318]">{error}</p>}

              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-full bg-[#efeeeb] px-4 text-[13px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={pending} className="h-10 rounded-full bg-[#1a1917] px-4 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50">
                  {pending ? 'Saving…' : 'Save interaction'}
                </button>
              </div>
            </CardBody>
          )}
        </Card>

        <Card>
          <CardHead
            title="Interaction log"
            sub={`${rows.length} contact${rows.length === 1 ? '' : 's'}`}
            right={
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 rounded-full bg-[#efeeeb] px-4 text-[13px] font-medium text-[#47453f]"
              >
                <option value="ALL">All channels</option>
                {CHANNELS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                <option value="STAGE_CHANGE">Stage change</option>
              </select>
            }
          />
          <div className="divide-y divide-[#e7e6e2]">
            {rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12px] text-[#a8a6a0]">
                {filter === 'ALL' ? 'No interactions logged yet.' : 'No interactions on this channel yet.'}
              </p>
            ) : rows.map((r) => {
              const meta = CHANNEL_META[r.channel] ?? { label: r.channel, Icon: History }
              const Icon = meta.Icon
              return (
                <div key={r.id} className="flex gap-3 px-5 py-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#efeeeb] text-[#5f5d58]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[#16161a]">{meta.label}</span>
                        {r.outcome && (
                          <span className="rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58]">{r.outcome}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#7c7a75] tnum">
                        {new Date(r.occurred_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {r.by ? ` · ${r.by}` : ''}
                      </span>
                    </div>
                    {r.note && <p className="mt-1.5 text-[12px] leading-relaxed text-[#5f5d58]">{r.note}</p>}
                    {r.next_follow_up && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#2440e8]">
                        <CalendarClock size={14} />
                        Follow-up {new Date(r.next_follow_up).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHead title="Contact" />
          <CardBody className="py-1">
            <KeyValueRow label="Mobile" value={lead.phone} mono />
            <KeyValueRow label="Email" value={lead.email || '—'} />
            <KeyValueRow label="Owner" value={ownerName ?? '—'} />
          </CardBody>
          <CardBody className="flex flex-wrap gap-2 pt-0">
            <button type="button" onClick={() => openWith('CALL')} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
              <Phone size={14} /> Call
            </button>
            <button type="button" onClick={() => openWith('WHATSAPP')} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button type="button" onClick={() => openWith('EMAIL')} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#efeeeb] px-3.5 text-[12px] font-semibold text-[#47453f] hover:bg-[#e3e2de]">
              <Mail size={14} /> Email
            </button>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="CRM sync" />
          <CardBody className="py-1">
            <KeyValueRow label="Status" value={lead.crm_synced ? 'Synced' : 'Pending'} />
            <KeyValueRow label="Last synced" value={lead.crm_synced_at ? new Date(lead.crm_synced_at).toLocaleString('en-IN') : 'Never'} />
            <KeyValueRow label="Created" value={new Date(lead.created_at).toLocaleDateString('en-IN')} mono />
          </CardBody>
        </Card>

        <div className="rounded-[20px] bg-[#eef1fe] px-4 py-3 text-[12px] leading-relaxed text-[#2447c9]">
          Every logged interaction feeds the follow-up engine. Anything not recorded here is invisible to the
          nurture triggers and to whoever picks the file up next.
        </div>
      </div>
    </div>
  )
}
