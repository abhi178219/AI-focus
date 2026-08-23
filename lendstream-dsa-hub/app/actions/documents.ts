'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import type { DocumentType } from '@/lib/types'

export async function uploadDocument(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const file = formData.get('file') as File | null
  const type = String(formData.get('type') ?? 'OTHER') as DocumentType
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
