'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export async function addLenderProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payload = {
    product_id: String(formData.get('product_id') ?? '').trim(),
    lender_name: String(formData.get('lender_name') ?? '').trim(),
    short_code: String(formData.get('short_code') ?? '').trim().toUpperCase(),
    display_name: String(formData.get('display_name') ?? '').trim(),
    interest_rate: num(formData.get('interest_rate')),
    max_sanction_amount: num(formData.get('max_sanction_amount')),
    min_tenure_years: num(formData.get('min_tenure_years')),
    max_tenure_years: num(formData.get('max_tenure_years')),
    processing_fee_percent: num(formData.get('processing_fee_percent')) ?? 1,
    turnaround_days: num(formData.get('turnaround_days')),
    credit_box_note: String(formData.get('credit_box_note') ?? '').trim() || null,
    created_by: user.id,
  }

  if (!payload.product_id || !payload.lender_name || !payload.display_name) {
    return { error: 'Product family, lender and product name are required.' }
  }
  if (!payload.interest_rate || payload.interest_rate <= 0) return { error: 'Enter an interest rate greater than zero.' }
  if (!payload.max_sanction_amount || payload.max_sanction_amount <= 0) return { error: 'Enter a max sanction greater than zero.' }
  if (payload.min_tenure_years === null || payload.max_tenure_years === null) return { error: 'Enter both a minimum and maximum tenure.' }
  if (payload.max_tenure_years < payload.min_tenure_years) return { error: 'Maximum tenure cannot be less than the minimum.' }
  if (!payload.short_code) payload.short_code = payload.display_name.slice(0, 6).toUpperCase()

  // RLS restricts writes to ops admins; a partner gets zero rows back rather
  // than an error, so check the row count, not just `error`.
  const { data, error } = await supabase.from('lender_products').insert(payload).select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: 'Could not add — only ops admins can change the product catalogue.' }
  }

  revalidatePath('/partner/products')
  return {}
}

export async function toggleLenderProduct(id: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('lender_products')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: 'Could not update — only ops admins can change the product catalogue.' }
  }

  revalidatePath('/partner/products')
  return {}
}
