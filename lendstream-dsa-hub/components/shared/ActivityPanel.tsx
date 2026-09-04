'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Phone, MessageCircle, Mail, MapPin, Building2, Plus, X, CalendarClock, History,
  Users, Landmark, UsersRound,
} from 'lucide-react'
import { addInteraction } from '@/app/actions/leads'
import { Card, CardHead, CardBody } from '@/components/ui/Card'
import { KeyValueRow } from '@/components/shared/StatTile'
import { ConsentStatusCard } from '@/components/shared/ConsentStatusCard'
import type { ApplicantConsent, Lead } from '@/lib/types'

type Category = 'CUSTOMER' | 'INTERNAL' | 'BANK'

const CATEGORIES: { key: Category; label: string; sub: string }[] = [
  { key: 'CUSTOMER', label: 'Customer interaction', sub: 'Calls, messages and visits with the applicant' },
  { key: 'INTERNAL', label: 'Internal interaction', sub: 'Sales, branch manager, ops and management touchpoints' },
  { key: 'BANK', label: 'Bank interaction', sub: 'Login, queries and decisions from the lender' },
]

/** Channels a user can log, per category — the prototype's five for
 *  Customer; Internal/Bank get the same set minus the customer-specific
 *  Field visit / Branch meeting, plus a generic Meeting. */
const CUSTOMER_CHANNELS = [
  { key: 'CALL', label: 'Call', Icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'EMAIL', label: 'Email', Icon: Mail },
  { key: 'FIELD_VISIT', label: 'Field visit', Icon: MapPin },
  { key: 'BRANCH_MEETING', label: 'Branch meeting', Icon: Building2 },
] as const

const INTERNAL_CHANNELS = [
  { key: 'CALL', label: 'Call', Icon: Phone },
  { key: 'WHATSAPP', label: 'WhatsApp', Icon: MessageCircle },
  { key: 'EMAIL', label: 'Email', Icon: Mail },
  { key: 'MEETING', label: 'Meeting', Icon: UsersRound },
] as const

const BANK_CHANNELS = [
  { key: 'CALL', label: 'Call', Icon: Phone },
  { key: 'EMAIL', label: 'Email', Icon: Mail },
  { key: 'MEETING', label: 'Meeting', Icon: UsersRound },
  { key: 'BRANCH_MEETING', label: 'Branch visit', Icon: Building2 },
] as const

const CHANNELS_BY_CATEGORY: Record<Category, readonly { key: string; label: string; Icon: typeof Phone }[]> = {
  CUSTOMER: CUSTOMER_CHANNELS, INTERNAL: INTERNAL_CHANNELS, BANK: BANK_CHANNELS,
}

/** STAGE_CHANGE is written by the stage picker, never logged by hand. */
const CHANNEL_META: Record<string, { label: string; Icon: typeof Phone }> = {
  ...Object.fromEntries(CUSTOMER_CHANNELS.map((c) => [c.key, { label: c.label, Icon: c.Icon }])),
  MEETING: { label: 'Meeting', Icon: UsersRound },
  STAGE_CHANGE: { label: 'Stage change', Icon: History },
}

/** Who an internal interaction was with — the `party` column's meaning for
 *  category INTERNAL. */
const INTERNAL_PARTIES = [
  { key: 'SALES', label: 'Sales' },
  { key: 'BM', label: 'Branch Manager' },
  { key: 'OPS', label: 'Ops' },
  { key: 'MANAGEMENT', label: 'Management' },
] as const

const CUSTOMER_DISPOSITIONS = [
  'Interested — hot lead',
  'Documents pending',
  'Follow-up scheduled',
  'Field visit verified',
  'Query resolved',
  'Negotiating on rate',
  'Not reachable',
  'Not interested',
]

const INTERNAL_DISPOSITIONS = [
  'Update shared',
  'Approval requested',
  'Approval given',
  'Query raised',
  'Escalated to management',
  'Action item assigned',
  'Resolved',
  'Pending decision',
]

const BANK_DISPOSITIONS = [
  'Login accepted',
  'Query raised by bank',
  'Documents sought',
  'Conditional approval',
  'Sanction received',
  'Disbursement pending',
  'Declined by bank',
  'Escalated',
]

const DISPOSITIONS_BY_CATEGORY: Record<Category, string[]> = {
  CUSTOMER: CUSTOMER_DISPOSITIONS, INTERNAL: INTERNAL_DISPOSITIONS, BANK: BANK_DISPOSITIONS,
}

export interface ActivityRow {
  id: string
  channel: string
  category: string
  party: string | null
  outcome: string | null
  note: string | null
  occurred_at: string
  next_follow_up: string | null
  by: string | null
}

function isCategory(v: string): v is Category {
  return v === 'CUSTOMER' || v === 'INTERNAL' || v === 'BANK'
}

export function ActivityPanel({
  leadId, lead, interactions, ownerName, bankNames, consents, isOwn,
}: {
  leadId: string
  lead: Lead
  interactions: ActivityRow[]
  ownerName: string | null
  bankNames: string[]
  /** This applicant's full consent history, newest first — feeds the sidebar
   *  ConsentStatusCard that replaced the old CRM sync card. */
  consents: ApplicantConsent[]
  /** Whether the viewer owns this lead; gates the "Send consent link" button. */
  isOwn: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('CUSTOMER')
  const [channel, setChannel] = useState<string>('CALL')
  const [party, setParty] = useState<string>('')
  const [disposition, setDisposition] = useState(CUSTOMER_DISPOSITIONS[0])
  const [note, setNote] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [tab, setTab] = useState<Category>('CUSTOMER')
  const [filter, setFilter] = useState('ALL')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const tabRows = useMemo(() => interactions.filter((i) => i.category === tab), [interactions, tab])
  const rows = useMemo(
    () => (filter === 'ALL' ? tabRows : tabRows.filter((i) => i.channel === filter)),
    [tabRows, filter],
  )
  const countByCategory = useMemo(() => {
    const m = new Map<Category, number>()
    for (const i of interactions) {
      const c = isCategory(i.category) ? i.category : 'CUSTOMER'
      m.set(c, (m.get(c) ?? 0) + 1)
    }
    return m
  }, [interactions])

  function selectCategory(next: Category) {
    setCategory(next)
    setChannel(CHANNELS_BY_CATEGORY[next][0].key)
    setDisposition(DISPOSITIONS_BY_CATEGORY[next][0])
    setParty(next === 'INTERNAL' ? INTERNAL_PARTIES[0].key : '')
    setError(null)
  }

  function save() {
    if (category === 'INTERNAL' && !party) {
      setError('Choose who the interaction was with.')
      return
    }
    if (category === 'BANK' && !party.trim()) {
      setError('Enter the bank or lender name.')
      return
    }
    if (!note.trim()) {
      setError('Add a short summary of what was discussed.')
      return
    }
    setError(null)
    const fd = new FormData()
    fd.set('category', category)
    fd.set('channel', channel)
    if (party) fd.set('party', party)
    fd.set('outcome', disposition)
    fd.set('note', note.trim())
    if (followUp) fd.set('next_follow_up', followUp)
    startTransition(async () => {
      const result = await addInteraction(leadId, fd)
      if (result?.error) { setError(result.error); return }
      setNote('')
      setFollowUp('')
      setOpen(false)
      setTab(category)
      router.refresh()
    })
  }

  function openWith(nextChannel: string) {
    selectCategory('CUSTOMER')
    setChannel(nextChannel)
    setOpen(true)
  }

  const activeChannels = CHANNELS_BY_CATEGORY[category]
  const partyLabel = INTERNAL_PARTIES.find((p) => p.key === party)?.label

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
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Interaction type</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => selectCategory(c.key)}
                      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12px] font-semibold transition-colors ${
                        category === c.key ? 'bg-[#1a1917] text-white' : 'bg-[#efeeeb] text-[#5f5d58] hover:bg-[#e3e2de]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-[#7c7a75]">{CATEGORIES.find((c) => c.key === category)?.sub}</p>
              </div>

              {category === 'INTERNAL' && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Who with</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERNAL_PARTIES.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setParty(p.key)}
                        className={`inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12px] font-semibold transition-colors ${
                          party === p.key ? 'bg-[#1a1917] text-white' : 'bg-[#efeeeb] text-[#5f5d58] hover:bg-[#e3e2de]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {category === 'BANK' && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Bank / lender</p>
                  <input
                    list="activity-bank-names"
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    placeholder="HDFC Bank"
                    className="h-9 w-full rounded-lg bg-[#efeeeb] px-3 text-[13px] text-[#16161a] placeholder:text-[#a8a6a0]"
                  />
                  <datalist id="activity-bank-names">
                    {bankNames.map((n) => <option key={n} value={n} />)}
                  </datalist>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#7c7a75]">Channel</p>
                <div className="flex flex-wrap gap-2">
                  {activeChannels.map(({ key, label, Icon }) => (
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
                    {DISPOSITIONS_BY_CATEGORY[category].map((d) => <option key={d} value={d}>{d}</option>)}
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
                  placeholder={
                    category === 'CUSTOMER' ? 'Keep it factual — what the customer said, what was agreed, what is outstanding.'
                      : category === 'INTERNAL' ? `Keep it factual — what was discussed with ${partyLabel ?? 'the team'}, what was agreed, what is outstanding.`
                      : 'Keep it factual — what the bank said, what was asked for, what is outstanding.'
                  }
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
            sub={`${rows.length} record${rows.length === 1 ? '' : 's'}`}
            right={
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 rounded-full bg-[#efeeeb] px-4 text-[13px] font-medium text-[#47453f]"
              >
                <option value="ALL">All channels</option>
                {CHANNELS_BY_CATEGORY[tab].map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                {tab === 'CUSTOMER' && <option value="STAGE_CHANGE">Stage change</option>}
              </select>
            }
          />
          <div className="flex gap-1 border-b border-[#e7e6e2] px-5 pb-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => { setTab(c.key); setFilter('ALL') }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  tab === c.key ? 'bg-[#1a1917] text-white' : 'text-[#5f5d58] hover:bg-[#efeeeb]'
                }`}
              >
                {c.label.replace(' interaction', '')}
                <span className={`rounded-full px-1.5 text-[10.5px] tnum ${tab === c.key ? 'bg-white/20' : 'bg-[#e3e2de] text-[#7c7a75]'}`}>
                  {countByCategory.get(c.key) ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="divide-y divide-[#e7e6e2]">
            {rows.length === 0 ? (
              <p className="px-5 py-8 text-center text-[12px] text-[#a8a6a0]">
                {filter === 'ALL' ? 'No interactions logged here yet.' : 'No interactions on this channel yet.'}
              </p>
            ) : rows.map((r) => {
              const meta = CHANNEL_META[r.channel] ?? { label: r.channel, Icon: History }
              const Icon = r.category === 'INTERNAL' ? Users : r.category === 'BANK' ? Landmark : meta.Icon
              const partyText = r.category === 'INTERNAL'
                ? INTERNAL_PARTIES.find((p) => p.key === r.party)?.label ?? r.party
                : r.category === 'BANK' ? r.party : null
              return (
                <div key={r.id} className="flex gap-3 px-5 py-3.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#efeeeb] text-[#5f5d58]">
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {partyText && <span className="text-[12px] font-semibold text-[#16161a]">{partyText}</span>}
                        <span className={`text-[12px] ${partyText ? 'text-[#7c7a75]' : 'font-semibold text-[#16161a]'}`}>{meta.label}</span>
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

        {/* Replaced the old "CRM sync" card, which reported on an integration
            this app does not have. Consent is the thing an agent actually needs
            at a glance while working the file — and the place to send the
            customer a link to record it themselves. */}
        <ConsentStatusCard
          leadId={leadId}
          applicantId={lead.applicant_id}
          consents={consents}
          isOwn={isOwn}
        />

        <div className="rounded-[20px] bg-[#eef1fe] px-4 py-3 text-[12px] leading-relaxed text-[#2447c9]">
          Every logged interaction feeds the follow-up engine. Anything not recorded here is invisible to the
          nurture triggers and to whoever picks the file up next.
        </div>
      </div>
    </div>
  )
}
