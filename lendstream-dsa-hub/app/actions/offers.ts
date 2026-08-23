'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateEmi } from '@/lib/decision/rulesEngine'

export async function addOffer(leadId: string, formData: FormData) {
  const supabase = await createClient()
  const bankName = String(formData.get('bank_name') ?? '').trim()
  const interestRate = Number(formData.get('interest_rate'))
  const tenureYears = Number(formData.get('tenure_years'))
  const approvedAmount = Number(formData.get('approved_amount'))
  const processingFee = Number(formData.get('processing_fee_percent') ?? 1)

  if (!bankName || !interestRate || !tenureYears || !approvedAmount) {
    return { error: 'Bank, rate, tenure, and approved amount are required.' }
  }

  const emi = calculateEmi(approvedAmount, interestRate, tenureYears)
  const { error } = await supabase.from('lender_offers').insert({
    lead_id: leadId, bank_name: bankName, interest_rate: interestRate, tenure_years: tenureYears,
    approved_amount: approvedAmount, processing_fee_percent: processingFee, emi, status: 'draft',
  })
  if (error) return { error: error.message }
  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}

export async function updateOfferStatus(leadId: string, offerId: string, status: 'draft' | 'shared' | 'accepted' | 'rejected') {
  const supabase = await createClient()
  const { error } = await supabase.from('lender_offers').update({ status }).eq('id', offerId)
  if (error) return { error: error.message }
  revalidatePath(`/partner/leads/${leadId}`)
  return {}
}
