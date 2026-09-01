'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type State = { error?: string }

/**
 * Edits an Applicant's (or Company's, or a key person's — all the same
 * table) own identity fields. Reuses the exact validation `createLead`
 * already applies at creation time, so a saved record can never end up
 * looser than a freshly-created one.
 */
export async function updateApplicant(applicantId: string, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const client_name = String(formData.get('client_name') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim() || null
  const pan_number = String(formData.get('pan_number') ?? '').trim().toUpperCase() || null
  const residence_address = String(formData.get('residence_address') ?? '').trim() || null
  const pincode = String(formData.get('pincode') ?? '').trim() || null

  if (!client_name || !/^\d{10}$/.test(phone)) {
    return { error: 'Enter a name and a valid 10-digit mobile number.' }
  }

  // RLS filters rather than errors, so check the affected row count.
  const { data, error } = await supabase
    .from('applicants')
    .update({ client_name, phone, email, pan_number, residence_address, pincode, updated_at: new Date().toISOString() })
    .eq('id', applicantId)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Could not save — you don't have access to this applicant." }

  revalidatePath(`/partner/applicants/${applicantId}`)
  revalidatePath('/partner/applicants')
  revalidatePath('/partner')
  return {}
}
