'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { DocumentType } from '@/lib/types'
import { DOC_TYPE_LABEL } from '@/lib/documentCategories'

const VALID_DOCUMENT_TYPES = new Set(Object.keys(DOC_TYPE_LABEL))

export async function uploadDocument(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File | null
  const rawType = String(formData.get('type') ?? '').trim()
  // The type selector must never silently fall back to a guessed value — a
  // bank statement uploaded with no real type chosen must not be filed (and
  // then extracted) as a PAN card. Require an explicit, valid choice.
  if (!rawType || !VALID_DOCUMENT_TYPES.has(rawType)) {
    return { error: 'Choose what kind of document this is before uploading.' }
  }
  const type = rawType as DocumentType
  if (!file || file.size === 0) return { error: 'Choose a file to upload.' }

  const documentId = randomUUID()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${leadId}/${documentId}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('lead-documents')
    .upload(storagePath, file, { contentType: file.type || undefined })

  if (uploadError) return { error: uploadError.message }

  const { error: insertError } = await supabase.from('documents').insert({
    id: documentId,
    lead_id: leadId,
    type,
    name: file.name,
    storage_path: storagePath,
    file_mime: file.type || null,
    uploaded_by: user.id,
  })

  if (insertError) return { error: insertError.message }

  revalidatePath(`/partner/leads/${leadId}`)
  return { documentId }
}
