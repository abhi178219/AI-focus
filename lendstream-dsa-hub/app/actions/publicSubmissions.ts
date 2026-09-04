'use server'

import { randomUUID } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { DOC_TYPE_LABEL } from '@/lib/documentCategories'
import {
  CONSENT_LINK_CHANNEL, CONSENT_TYPES,
  type ConsentType, type CustomerLinkPurpose, type DocumentType,
  type PublicConsentPageData, type PublicUploadPageData,
} from '@/lib/types'

/**
 * The PUBLIC half of the customer-link feature — the only unauthenticated write
 * path in this app. Read this header before changing anything below it.
 *
 * There is no user here and no session, so there is no `auth.getUser()` check
 * to make: THE TOKEN IS THE AUTHORISATION. It is a bearer capability — a
 * 122-bit random uuid minted by Postgres — and holding it is the whole of the
 * caller's claim. That has three consequences, each load-bearing:
 *
 * 1. Every exported function below independently re-resolves the token as its
 *    FIRST step. Not one of them assumes a check made by a sibling call still
 *    holds: each is a separate request from an untrusted client, and a link may
 *    have expired between them.
 *
 * 2. Nothing else in a public request is trusted. A caller may name a token and
 *    nothing else — no lead_id, no applicant_id, no agent_id, no document id.
 *    Every read and write is scoped to the `lead_id`/`applicant_id` recorded on
 *    the resolved `customer_links` row, and the storage path's agent segment is
 *    read off the lead, never accepted from the form.
 *
 * 3. These functions use `createServiceClient()`, which bypasses RLS entirely.
 *    That is precisely why `customer_links` has no anon RLS policy: the service
 *    client is confined to this file, behind the token check, instead of the
 *    database being opened up to the anon role where anyone could query it
 *    directly through Supabase's REST API.
 *
 * A bad token gets one flat answer — no hint about whether it was unknown,
 * expired, or for the other purpose, and no "did you mean". Token
 * unguessability is the control; there is deliberately no rate limiting or
 * CAPTCHA in this pass, and nothing here may leak a signal that would help
 * someone find a valid token.
 */

/** The single message a public visitor ever sees for a token that doesn't work. */
const INVALID_LINK = 'This link is invalid or has expired.'

const VALID_DOCUMENT_TYPES = new Set(Object.keys(DOC_TYPE_LABEL))

/** Generic failure text for the public side — a raw Postgres/storage message
 *  would tell an untrusted caller about the schema. Nothing is swallowed
 *  silently: the caller is always told the write did not happen. */
const SAVE_FAILED = 'Something went wrong saving that. Please try again.'

/** Uploads are capped so a single public request cannot push an arbitrarily
 *  large object into the bucket. Not rate limiting — plain input validation. */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

/** `token` reaches us as a raw URL segment. The column is `uuid`, so anything
 *  that isn't one is rejected here rather than sent to Postgres to fail as a
 *  cast error — same flat answer, and no error text ever leaves the server. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface ResolvedLink {
  id: string
  purpose: CustomerLinkPurpose
  lead_id: string
  applicant_id: string
  created_by: string
  expires_at: string
}

/**
 * THE shared validator. Every public entry point calls this first and does
 * nothing at all until it returns a row.
 *
 * Deliberately NOT exported: a `'use server'` export is a callable endpoint,
 * and a token-validity oracle is exactly the kind of thing this feature must
 * not hand out.
 */
async function resolveCustomerLink(
  token: string,
  expectedPurpose: CustomerLinkPurpose,
): Promise<ResolvedLink | null> {
  if (typeof token !== 'string' || !UUID_RE.test(token)) return null

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('customer_links')
    .select('id, purpose, lead_id, applicant_id, created_by, expires_at')
    .eq('token', token)
    .maybeSingle<ResolvedLink>()

  if (error || !data) return null
  // A CONSENT token must not work on the upload page, and vice versa: one
  // capability, one flow.
  if (data.purpose !== expectedPurpose) return null
  // Expiry is checked against the row's own timestamp, not anything the caller
  // sent, and `<=` so an exactly-expired link is dead rather than borderline.
  if (new Date(data.expires_at).getTime() <= Date.now()) return null
  return data
}

/**
 * A greeting the person will recognise without exposing anything else about
 * them. An individual gets their first name; a company keeps its full stored
 * name, since the first word of "Sunrise Textiles Pvt Ltd" is not a name.
 */
function displayNameFor(clientName: string, isCompany: boolean): string {
  const name = clientName.trim()
  if (isCompany || !name) return name
  return name.split(/\s+/)[0]
}

// ---------------------------------------------------------------------------
// Consent flow
// ---------------------------------------------------------------------------

/**
 * Page data for /consent/[token]. Returns only a display name and the current
 * latest-per-type consent state — the visitor sees nothing about the loan file
 * the link happens to hang off.
 */
export async function getConsentPageData(token: string): Promise<PublicConsentPageData> {
  const link = await resolveCustomerLink(token, 'CONSENT')
  if (!link) return { ok: false }

  const supabase = createServiceClient()

  // Scoped to the applicant the LINK named. There is no code path by which a
  // visitor can ask about a different one.
  const { data: applicant } = await supabase
    .from('applicants')
    .select('client_name, entity_type')
    .eq('id', link.applicant_id)
    .maybeSingle<{ client_name: string; entity_type: string }>()
  if (!applicant) return { ok: false }

  const { data: consents } = await supabase
    .from('applicant_consents')
    .select('consent_type, granted, captured_at')
    .eq('applicant_id', link.applicant_id)
    .order('captured_at', { ascending: false })
    .returns<{ consent_type: ConsentType; granted: boolean; captured_at: string }[]>()

  // Append-only history, so "current" is simply the newest row per type — the
  // same rule the Consent Centre uses.
  const latestByType: Partial<Record<ConsentType, { granted: boolean; captured_at: string }>> = {}
  for (const c of consents ?? []) {
    if (!latestByType[c.consent_type]) {
      latestByType[c.consent_type] = { granted: c.granted, captured_at: c.captured_at }
    }
  }

  return {
    ok: true,
    displayName: displayNameFor(applicant.client_name, applicant.entity_type === 'COMPANY'),
    latestByType,
  }
}

/**
 * Records the customer's three consent decisions as three new
 * `applicant_consents` rows — the same append-only table the Consent Centre
 * writes, not a second consent system. A fresh submission supersedes the prior
 * one by being the latest, so re-opening the link within its window and
 * changing an answer is a legitimate, fully-recorded act.
 *
 * `captured_by` is the agent who created the link. `applicant_consents
 * .captured_by` is `not null references profiles(id)` and a customer has no
 * profile row, so this is the honest attribution rather than a fiction: the
 * agent is accountable for having sent the link. `channel` says 'Consent link',
 * which is what distinguishes these rows from a hand-recorded capture.
 */
export async function submitPublicConsent(token: string, formData: FormData): Promise<{ error?: string }> {
  const link = await resolveCustomerLink(token, 'CONSENT')
  if (!link) return { error: INVALID_LINK }

  // Same discipline as `recordConsent`: a missing answer is a form bug, not a
  // refusal. Recording a fabricated "no" is as wrong as fabricating a "yes".
  const rows: {
    applicant_id: string; consent_type: ConsentType; granted: boolean
    channel: string; captured_by: string
  }[] = []

  for (const consentType of CONSENT_TYPES) {
    const raw = String(formData.get(`consent_${consentType}`) ?? '').trim()
    if (raw !== 'true' && raw !== 'false') {
      return { error: 'Please choose Accept or Decline for each item.' }
    }
    rows.push({
      applicant_id: link.applicant_id,
      consent_type: consentType,
      granted: raw === 'true',
      channel: CONSENT_LINK_CHANNEL,
      captured_by: link.created_by,
    })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.from('applicant_consents').insert(rows).select('id')
  if (error || !data || data.length !== rows.length) return { error: SAVE_FAILED }

  return {}
}

// ---------------------------------------------------------------------------
// Document upload flow
// ---------------------------------------------------------------------------

/**
 * Page data for /upload/[token]: what this product requires, and a bare list of
 * what is already on file — type and upload date only. No file names, no
 * storage paths, no ids, nothing from any other lead.
 */
export async function getUploadPageData(token: string): Promise<PublicUploadPageData> {
  const link = await resolveCustomerLink(token, 'DOCUMENT_UPLOAD')
  if (!link) return { ok: false }

  const supabase = createServiceClient()

  const { data: lead } = await supabase
    .from('leads')
    .select('id, loan_type')
    .eq('id', link.lead_id)
    .maybeSingle<{ id: string; loan_type: string }>()
  if (!lead) return { ok: false }

  const { data: applicant } = await supabase
    .from('applicants')
    .select('client_name, entity_type')
    .eq('id', link.applicant_id)
    .maybeSingle<{ client_name: string; entity_type: string }>()
  if (!applicant) return { ok: false }

  // Mirrors LeadDetail.tsx exactly: the product family's own catalogue
  // requirements, de-duplicated. Nothing is invented if the catalogue is silent
  // — the page then simply shows no required list.
  const productCategories = lead.loan_type === 'BOTH' ? ['PL', 'HL'] : [lead.loan_type]
  const { data: catalogueProducts } = await supabase
    .from('products')
    .select('id, required_documents')
    .in('category', productCategories)
    .returns<{ id: string; required_documents: string[] | null }[]>()
  const requiredDocTypes = [...new Set((catalogueProducts ?? []).flatMap((p) => p.required_documents ?? []))]

  const { data: documents } = await supabase
    .from('documents')
    .select('type, uploaded_at')
    .eq('lead_id', lead.id)
    .order('uploaded_at', { ascending: false })
    .returns<{ type: DocumentType; uploaded_at: string }[]>()

  return {
    ok: true,
    displayName: displayNameFor(applicant.client_name, applicant.entity_type === 'COMPANY'),
    requiredDocTypes,
    onFile: (documents ?? []).map((d) => ({ type: d.type, uploaded_at: d.uploaded_at })),
  }
}

/**
 * Accepts one file from the customer onto the lead the LINK names.
 *
 * `uploaded_by` is null — honestly "not uploaded by a system user". The column
 * is already nullable; attributing a customer's upload to some profile would be
 * a fabrication. The storage path's agent segment is read off the lead, never
 * taken from the form, so a public request cannot write into another agent's
 * folder. The type is validated against the same vocabulary `uploadDocument`
 * uses, with no fallback — a mis-filed document is later extracted as the wrong
 * kind of document.
 */
export async function submitPublicDocument(token: string, formData: FormData): Promise<{ error?: string }> {
  const link = await resolveCustomerLink(token, 'DOCUMENT_UPLOAD')
  if (!link) return { error: INVALID_LINK }

  const rawType = String(formData.get('type') ?? '').trim()
  if (!rawType || !VALID_DOCUMENT_TYPES.has(rawType)) {
    return { error: 'Choose what kind of document this is before uploading.' }
  }
  const type = rawType as DocumentType

  const file = formData.get('file') as File | null
  if (!file || typeof file === 'string' || file.size === 0) return { error: 'Choose a file to upload.' }
  if (file.size > MAX_UPLOAD_BYTES) return { error: 'That file is too large — please upload a file under 20 MB.' }

  const supabase = createServiceClient()

  // The owning agent comes from the lead the link named. Never from the client.
  const { data: lead } = await supabase
    .from('leads')
    .select('id, agent_id')
    .eq('id', link.lead_id)
    .maybeSingle<{ id: string; agent_id: string }>()
  if (!lead) return { error: INVALID_LINK }

  const documentId = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  // Same convention as uploadDocument: {agent_id}/{lead_id}/{documentId}-{name}
  const storagePath = `${lead.agent_id}/${lead.id}/${documentId}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('lead-documents')
    .upload(storagePath, file, { contentType: file.type || undefined })
  if (uploadError) return { error: SAVE_FAILED }

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      lead_id: lead.id,
      type,
      name: file.name,
      storage_path: storagePath,
      file_mime: file.type || null,
      uploaded_by: null,
    })
    .select('id')
  if (insertError || !data || data.length === 0) return { error: SAVE_FAILED }

  return {}
}
