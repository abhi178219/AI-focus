'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CustomerLinkPurpose } from '@/lib/types'

/**
 * The AUTHENTICATED half of the customer-link feature: an agent (or ops)
 * generating a link to send to their own customer.
 *
 * Everything here runs under the normal cookie-based client with RLS enforced —
 * ordinary server-action discipline, identical to every other action in this
 * app. The PUBLIC half, which runs with no user at all and treats the token
 * itself as the authorisation, lives in a deliberately separate file
 * (app/actions/publicSubmissions.ts) so the trust boundary is obvious at a
 * glance rather than buried among authenticated functions.
 */

/** How long a link stays usable. Not single-use: a customer may re-open it and
 *  respond again within the window, each response recorded as a fresh row. */
const LINK_TTL_DAYS = 7

const PUBLIC_PATH: Record<CustomerLinkPurpose, string> = {
  CONSENT: 'consent',
  DOCUMENT_UPLOAD: 'upload',
}

type LinkResult = { url?: string; error?: string }

/**
 * Next.js gives a server action no access to the request host, so the calling
 * client component passes `window.location.origin`. It is only ever used to
 * compose a string shown back to the agent who asked for it — it never reaches
 * the database and never influences which lead is touched — but it is still
 * parsed and reduced to a bare http(s) origin rather than concatenated raw.
 */
function safeOrigin(baseUrl: string): string | null {
  try {
    const url = new URL(baseUrl)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

async function createCustomerLink(
  leadId: string,
  baseUrl: string,
  purpose: CustomerLinkPurpose,
): Promise<LinkResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const origin = safeOrigin(baseUrl)
  if (!origin) return { error: 'Could not work out this app’s address — reload the page and try again.' }

  // The applicant is read off the lead rather than accepted from the caller, so
  // a link can never be minted pointing at someone else's applicant. RLS scopes
  // this read, so a lead the user cannot see simply isn't found.
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('id, applicant_id')
    .eq('id', leadId)
    .maybeSingle<{ id: string; applicant_id: string }>()
  if (leadError) return { error: leadError.message }
  if (!lead) return { error: "Could not create a link — you don't have access to this file." }

  const expiresAt = new Date(Date.now() + LINK_TTL_DAYS * 86_400_000).toISOString()

  // `token` is deliberately not supplied: the column's `gen_random_uuid()`
  // default mints it, so the unguessable value is generated in exactly one
  // place and never travels through application code before it exists.
  const { data, error } = await supabase
    .from('customer_links')
    .insert({
      purpose,
      lead_id: lead.id,
      applicant_id: lead.applicant_id,
      created_by: user.id,
      expires_at: expiresAt,
    })
    .select('token')
  if (error) return { error: error.message }
  // RLS filters silently — a denied insert returns zero rows and no error.
  if (!data || data.length === 0) return { error: "Could not create a link — you don't have access to this file." }

  revalidatePath(`/partner/leads/${lead.id}`)
  return { url: `${origin}/${PUBLIC_PATH[purpose]}/${data[0].token}` }
}

/** A link letting the customer record their three consent decisions. */
export async function createConsentLink(leadId: string, baseUrl: string): Promise<LinkResult> {
  return createCustomerLink(leadId, baseUrl, 'CONSENT')
}

/** A link letting the customer upload documents onto this one loan file. */
export async function createDocumentUploadLink(leadId: string, baseUrl: string): Promise<LinkResult> {
  return createCustomerLink(leadId, baseUrl, 'DOCUMENT_UPLOAD')
}
