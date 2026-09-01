'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { updateKeyPersonnelDesignation } from '@/app/actions/keyPersonnel'
import type { KeyPersonnel } from '@/lib/types'

type State = { error?: string }

interface Person {
  id: string
  client_name: string
  phone: string
  pan_number: string | null
}

export function KeyPersonnelList({
  keyPersonnel, linkedApplicantById, appCountByApplicant, isOwn,
}: {
  keyPersonnel: KeyPersonnel[]
  linkedApplicantById: Map<string, Person>
  appCountByApplicant: Map<string, number>
  isOwn: boolean
}) {
  return (
    <div className="divide-y divide-[#e7e6e2]">
      {keyPersonnel.map((k) => {
        const person = linkedApplicantById.get(k.linked_applicant_id)
        if (!person) return null
        return (
          <KeyPersonnelRow
            key={k.id}
            keyPersonnelId={k.id}
            designation={k.designation}
            person={person}
            count={appCountByApplicant.get(k.linked_applicant_id) ?? 0}
            isOwn={isOwn}
          />
        )
      })}
    </div>
  )
}

function KeyPersonnelRow({
  keyPersonnelId, designation, person, count, isOwn,
}: {
  keyPersonnelId: string
  designation: string | null
  person: Person
  count: number
  isOwn: boolean
}) {
  const [editing, setEditing] = useState(false)

  async function action(_prev: State, formData: FormData): Promise<State> {
    const result = await updateKeyPersonnelDesignation(keyPersonnelId, formData)
    if (!result?.error) setEditing(false)
    return result ?? {}
  }
  const [state, formAction, pending] = useActionState<State, FormData>(action, {})

  if (editing) {
    return (
      <form action={formAction} className="flex items-center gap-4 px-6 py-3.5">
        <Avatar name={person.client_name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#16161a]">{person.client_name}</p>
          <input
            name="designation"
            defaultValue={designation ?? ''}
            placeholder="Designation, e.g. Director"
            autoFocus
            className="mt-1 w-full max-w-[220px] rounded-md border border-[#dcdbd6] bg-white px-2 py-1 text-[12px] focus:border-[#16161a] focus:outline-none"
          />
          {state?.error && <p className="mt-1 text-[11px] text-red-600">{state.error}</p>}
        </div>
        <button type="submit" disabled={pending} className="shrink-0 rounded-full bg-[#1a1917] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
          {pending ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={() => setEditing(false)} disabled={pending} className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold text-[#7c7a75] hover:bg-[#efeeeb]">
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className="group flex items-center gap-4 px-6 py-3.5 hover:bg-[#efeeeb]">
      <Link href={`/partner/applicants/${person.id}`} className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar name={person.client_name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#16161a]">{person.client_name}</p>
          <p className="truncate text-[11px] text-[#7c7a75]">
            {designation ?? 'Key personnel'} · {person.phone}{person.pan_number ? ` · ${person.pan_number}` : ''}
          </p>
        </div>
      </Link>
      {isOwn && (
        <button
          type="button" onClick={() => setEditing(true)} title="Edit designation"
          className="shrink-0 rounded-full p-1.5 text-[#a8a6a0] opacity-0 hover:bg-[#e3e2de] hover:text-[#47453f] group-hover:opacity-100"
        >
          <Pencil size={13} />
        </button>
      )}
      <span className="shrink-0 rounded-full bg-[#efeeeb] px-2.5 py-1 text-[11px] font-semibold text-[#5f5d58] tnum">
        {count} product{count === 1 ? '' : 's'}
      </span>
    </div>
  )
}
