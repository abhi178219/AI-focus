'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  APPLICANT_DOC_TYPE_LABEL, CONSENT_TYPE_LABEL, LEAD_SOURCE_LABEL,
  type ApplicantDocumentType, type ApplicantInteractionChannel, type ConsentType, type LeadSourceChannel,
} from '@/lib/types'

/**
 * Server actions for the Applicant relationship layer — attribution, consent
 * history, the document vault and relationship touchpoints. All four write to
 * `applicant_id`-scoped tables and stay entirely clear of the lead-scoped
 * `documents`/`interactions` flows.
 *
 * Same discipline as the rest of this codebase: authenticate, validate every
 * enum against its real vocabulary (never guess a default), and check the
 * affected row count rather than just the absence of `error` — RLS filters
 * silently, so a denied write returns zero rows and no error at all.
 */

type State = { error?: string }

const VALID_SOURCE_CHANNELS = new Set(Object.keys(LEAD_SOURCE_LABEL))
const VALID_CONSENT_TYPES = new Set(Object.keys(CONSENT_TYPE_LABEL))
const VALID_DOC_TYPES = new Set(Object.keys(APPLICANT_DOC_TYPE_LABEL))
const VALID_CHANNELS = new Set(['CALL', 'WHATSAPP', 'EMAIL', 'FIELD_VISIT', 'BRANCH_MEETING', 'MEETING'])
/** The capture channels offered on the consent form. Free-form in the DB, but
 *  the UI only ever sends one of these — reject anything else rather than
 *  storing an arbitrary string in a compliance record. */
const VALID_CONSENT_CHANNELS = new Set(['App', 'SMS', 'Email', 'WhatsApp', 'Physical form'])

/** Attribution: how this relationship was sourced. Own-or-ops via the existing
 *  `applicants_update_own_or_ops` policy (017). */
export async function updateLeadSource(applicantId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawChannel = String(formData.get('lead_source_channel') ?? '').trim()
  // An empty selection legitimately means "clear it" — but a non-empty value
  // that isn't in the vocabulary is a bug, not a silent fallback.
  if (rawChannel && !VALID_SOURCE_CHANNELS.has(rawChannel)) {
    return { error: 'Choose a valid lead source.' }
  }
  const lead_source_channel = (rawChannel || null) as LeadSourceChannel | null
  const referring_partner = String(formData.get('referring_partner') ?? '').trim() || null

  const { data, error } = await supabase
    .from('applicants')
    .update({ lead_source_channel, referring_partner, updated_at: new Date().toISOString() })
    .eq('id', applicantId)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this applicant." }

  revalidatePath(`/partner/applicants/${applicantId}`)
  return {}
}

/**
 * Records a consent decision. Always an INSERT — a new capture supersedes the
 * prior one by being the latest `captured_at`, so the history stays intact.
 * Never updates an existing row.
 */
export async function recordConsent(applicantId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawType = String(formData.get('consent_type') ?? '').trim()
  if (!rawType || !VALID_CONSENT_TYPES.has(rawType)) {
    return { error: 'Choose which consent this is.' }
  }
  const consent_type = rawType as ConsentType

  // Granted must be an explicit choice. A missing value is a form bug, not a
  // "no" — recording a fabricated refusal is as wrong as fabricating consent.
  const rawGranted = String(formData.get('granted') ?? '').trim()
  if (rawGranted !== 'true' && rawGranted !== 'false') {
    return { error: 'Record whether consent was given or refused.' }
  }
  const granted = rawGranted === 'true'

  const rawChannel = String(formData.get('channel') ?? '').trim()
  if (rawChannel && !VALID_CONSENT_CHANNELS.has(rawChannel)) {
    return { error: 'Choose a valid capture channel.' }
  }

  const { data, error } = await supabase
    .from('applicant_consents')
    .insert({
      applicant_id: applicantId,
      consent_type,
      granted,
      channel: rawChannel || null,
      captured_by: user.id,
    })
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this applicant." }

  revalidatePath(`/partner/applicants/${applicantId}`)
  return {}
}

/**
 * Uploads a document into the applicant's vault. Mirrors `uploadDocument`
 * (app/actions/documents.ts) but targets the `applicant-documents` bucket and
 * `applicant_documents` table — and deliberately triggers NO extraction
 * pipeline: vault documents are stored and listed, never parsed.
 */
export async function uploadApplicantDocument(applicantId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File | null
  const rawType = String(formData.get('type') ?? '').trim()
  if (!rawType || !VALID_DOC_TYPES.has(rawType)) {
    return { error: 'Choose what kind of document this is before uploading.' }
  }
  const type = rawType as ApplicantDocumentType
  if (!file || file.size === 0) return { error: 'Choose a file to upload.' }

  const documentId = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  // Path convention mirrors lead-documents: {agent_id}/{applicant_id}/{id}-{name}.
  const storagePath = `${user.id}/${applicantId}/${documentId}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('applicant-documents')
    .upload(storagePath, file, { contentType: file.type || undefined })
  if (uploadError) return { error: uploadError.message }

  const { data, error: insertError } = await supabase
    .from('applicant_documents')
    .insert({
      id: documentId,
      applicant_id: applicantId,
      type,
      name: file.name,
      storage_path: storagePath,
      file_mime: file.type || null,
      uploaded_by: user.id,
    })
    .select('id')
  if (insertError) return { error: insertError.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this applicant." }

  revalidatePath(`/partner/applicants/${applicantId}`)
  return { documentId }
}

/**
 * Logs a relationship-level touchpoint. Mirrors `addInteraction` in
 * app/actions/leads.ts, minus the category/party split — that split is specific
 * to working one loan file and has no meaning at the relationship level.
 */
export async function addApplicantInteraction(applicantId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rawChannel = String(formData.get('channel') ?? '').trim()
  if (!rawChannel || !VALID_CHANNELS.has(rawChannel)) {
    return { error: 'Choose how this touchpoint happened.' }
  }
  const channel = rawChannel as ApplicantInteractionChannel

  const note = String(formData.get('note') ?? '').trim() || null
  const next_follow_up = String(formData.get('next_follow_up') ?? '').trim() || null

  const { data, error } = await supabase
    .from('applicant_interactions')
    .insert({ applicant_id: applicantId, agent_id: user.id, channel, note, next_follow_up })
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this applicant." }

  revalidatePath(`/partner/applicants/${applicantId}`)
  return {}
}
