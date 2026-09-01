'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DOC_TYPE_LABEL } from '@/lib/documentCategories'
import {
  POLICY_PRODUCTS, POLICY_HARD_DECLINE_TRIGGERS, POLICY_REFER_TRIGGERS,
  type DocumentType, type Policy, type PolicyCollateralType, type PolicyEmploymentType,
  type PolicyParams, type PolicyProduct, type PolicyResidency, type PolicyThinFileTreatment,
} from '@/lib/types'

type State = { error?: string }

const VALID_DOCUMENT_TYPES = new Set(Object.keys(DOC_TYPE_LABEL))
const VALID_PRODUCTS = new Set<string>(POLICY_PRODUCTS)
const VALID_EMPLOYMENT = new Set(['SALARIED', 'SELF_EMPLOYED'])
const VALID_RESIDENCY = new Set(['RESIDENT', 'NRI'])
const VALID_COLLATERAL_TYPES = new Set(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'LAND'])
const VALID_THIN_FILE = new Set(['REFER', 'DECLINE', 'MANUAL_REVIEW'])

const NOT_OPS = 'Only Ops Admins can change policy configuration.'

/** Resolves the signed-in user only — creating a policy is open to any
 *  signed-in user (see 028_policies_open_create.sql); publish-control actions
 *  below still require ops_admin via requireOpsAdmin(). */
async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

function num(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function text(v: FormDataEntryValue | null): string | null {
  return String(v ?? '').trim() || null
}

/** Checkbox groups are whitelisted against a known vocabulary rather than
 *  trusting whatever values a submitted form carries — same discipline as
 *  addLenderProduct's required_documents handling. */
function picks(formData: FormData, field: string, allowed: Set<string>): string[] {
  return formData.getAll(field).map(String).filter((v) => allowed.has(v))
}

/** Resolves the signed-in user and confirms they're an ops admin. Checked in
 *  the action as well as in RLS so the UI can show a sentence rather than a
 *  raw Postgres error. */
async function requireOpsAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, isOps: profile?.role === 'ops_admin' }
}

/** Highest existing version for a policy_code, or 0 when it's brand new. */
async function maxVersion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  policyCode: string,
): Promise<number> {
  const { data } = await supabase
    .from('policies')
    .select('version')
    .eq('policy_code', policyCode)
    .order('version', { ascending: false })
    .limit(1)
  return data?.[0]?.version ?? 0
}

function parseParams(formData: FormData): PolicyParams {
  return {
    applicant: {
      age_min: num(formData.get('age_min')),
      age_max: num(formData.get('age_max')),
      employment_types: picks(formData, 'employment_types', VALID_EMPLOYMENT) as PolicyEmploymentType[],
      min_employment_vintage_years: num(formData.get('min_employment_vintage_years')),
      residency: picks(formData, 'residency', VALID_RESIDENCY) as PolicyResidency[],
    },
    financial: {
      min_monthly_income: num(formData.get('min_monthly_income')),
      income_averaging_months: num(formData.get('income_averaging_months')),
      variable_income_haircut_percent: num(formData.get('variable_income_haircut_percent')),
      max_foir_percent: num(formData.get('max_foir_percent')),
      max_dti_percent: num(formData.get('max_dti_percent')),
      obligation_haircut_percent: num(formData.get('obligation_haircut_percent')),
    },
    bureau: {
      min_bureau_score: num(formData.get('min_bureau_score')),
      thin_file_treatment: VALID_THIN_FILE.has(String(formData.get('thin_file_treatment') ?? ''))
        ? (String(formData.get('thin_file_treatment')) as PolicyThinFileTreatment)
        : null,
      max_dpd_30_count: num(formData.get('max_dpd_30_count')),
      max_dpd_90_count: num(formData.get('max_dpd_90_count')),
      exclude_write_off: formData.get('exclude_write_off') != null,
      exclude_settlement: formData.get('exclude_settlement') != null,
      max_enquiries_last_6m: num(formData.get('max_enquiries_last_6m')),
    },
    collateral: {
      max_ltv_percent: num(formData.get('max_ltv_percent')),
      min_property_value: num(formData.get('min_property_value')),
      valuation_age_max_months: num(formData.get('valuation_age_max_months')),
      accepted_collateral_types: picks(formData, 'accepted_collateral_types', VALID_COLLATERAL_TYPES) as PolicyCollateralType[],
    },
    pricing: {
      min_amount: num(formData.get('min_amount')),
      max_amount: num(formData.get('max_amount')),
      min_tenure_years: num(formData.get('min_tenure_years')),
      max_tenure_years: num(formData.get('max_tenure_years')),
      base_rate_percent: num(formData.get('base_rate_percent')),
      max_risk_premium_percent: num(formData.get('max_risk_premium_percent')),
      processing_fee_percent: num(formData.get('processing_fee_percent')),
    },
    decision: {
      hard_decline_triggers: picks(formData, 'hard_decline_triggers', new Set(Object.keys(POLICY_HARD_DECLINE_TRIGGERS))),
      refer_triggers: picks(formData, 'refer_triggers', new Set(Object.keys(POLICY_REFER_TRIGGERS))),
      required_documents: picks(formData, 'required_documents', VALID_DOCUMENT_TYPES) as DocumentType[],
    },
  }
}

/**
 * Creates the next DRAFT version of a policy. Open to any signed-in user —
 * authoring a draft is not a publish-control action. A brand-new `policy_code`
 * starts at v1; an existing one gets max(version) + 1. Never activates on
 * create — activation is a separate, ops-admin-only, deliberate step.
 */
export async function createPolicy(formData: FormData): Promise<State> {
  const { supabase, user } = await requireUser()

  const policy_code = String(formData.get('policy_code') ?? '').trim().toUpperCase()
  const name = String(formData.get('name') ?? '').trim()
  const product = String(formData.get('product') ?? '').trim()

  if (!policy_code) return { error: 'Enter a policy code.' }
  if (!name) return { error: 'Enter a policy name.' }
  if (!VALID_PRODUCTS.has(product)) return { error: 'Select the product this policy applies to.' }

  const effective_from = text(formData.get('effective_from'))
  const effective_to = text(formData.get('effective_to'))
  if (effective_from && effective_to && effective_to < effective_from) {
    return { error: 'Effective-to cannot be earlier than effective-from.' }
  }

  const version = (await maxVersion(supabase, policy_code)) + 1

  const { data, error } = await supabase.from('policies').insert({
    policy_code,
    version,
    name,
    description: text(formData.get('description')),
    product: product as PolicyProduct,
    status: 'DRAFT',
    priority: num(formData.get('priority')) ?? 100,
    effective_from,
    effective_to,
    change_reason: text(formData.get('change_reason')),
    params: parseParams(formData),
    created_by: user.id,
  }).select('id')

  if (error) return { error: error.message }
  // RLS filters rather than errors, so check the row count too.
  if (!data || data.length === 0) return { error: 'Could not save — please try again.' }

  revalidatePath('/partner/policy')
  redirect(`/partner/policy/${data[0].id}`)
}

/**
 * Publishes a version and retires whatever version of the same policy_code was
 * live before it — a policy_code never has two ACTIVE versions at once. This
 * is the simplified, single-actor stand-in for the reference sheet's
 * effective-dating control: there is no approval step, because this app has no
 * Approver role distinct from ops_admin.
 */
export async function activatePolicy(policyId: string): Promise<State> {
  const { supabase, isOps } = await requireOpsAdmin()
  if (!isOps) return { error: NOT_OPS }

  const { data: target } = await supabase
    .from('policies').select('policy_code').eq('id', policyId).maybeSingle()
  if (!target) return { error: 'Policy not found.' }

  const now = new Date().toISOString()

  const { data: activated, error: activateError } = await supabase
    .from('policies')
    .update({ status: 'ACTIVE', activated_at: now, updated_at: now })
    .eq('id', policyId)
    .select('id')

  if (activateError) return { error: activateError.message }
  if (!activated || activated.length === 0) return { error: NOT_OPS }

  // Retire the previously-live version, if any. No rows is the normal case for
  // a first activation, so an empty result here is not a permission problem.
  const { error: retireError } = await supabase
    .from('policies')
    .update({ status: 'INACTIVE', updated_at: now })
    .eq('policy_code', target.policy_code)
    .eq('status', 'ACTIVE')
    .neq('id', policyId)
    .select('id')

  if (retireError) return { error: retireError.message }

  revalidatePath('/partner/policy')
  revalidatePath(`/partner/policy/${policyId}`)
  return {}
}

/** Pauses a live policy without deleting or re-versioning it. */
export async function deactivatePolicy(policyId: string): Promise<State> {
  const { supabase, isOps } = await requireOpsAdmin()
  if (!isOps) return { error: NOT_OPS }

  const { data, error } = await supabase
    .from('policies')
    .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
    .eq('id', policyId)
    .select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: NOT_OPS }

  revalidatePath('/partner/policy')
  revalidatePath(`/partner/policy/${policyId}`)
  return {}
}

/**
 * The only way to revise a published policy: copy it to a new DRAFT version
 * under the same policy_code. Published versions are never edited in place, so
 * what was live at any point stays readable.
 */
export async function duplicatePolicyAsNewVersion(policyId: string): Promise<State> {
  const { supabase, user, isOps } = await requireOpsAdmin()
  if (!isOps) return { error: NOT_OPS }

  const { data: source } = await supabase
    .from('policies').select('*').eq('id', policyId).maybeSingle<Policy>()
  if (!source) return { error: 'Policy not found.' }

  const version = (await maxVersion(supabase, source.policy_code)) + 1

  const { data, error } = await supabase.from('policies').insert({
    policy_code: source.policy_code,
    version,
    name: source.name,
    description: source.description,
    product: source.product,
    status: 'DRAFT',
    priority: source.priority,
    effective_from: source.effective_from,
    effective_to: source.effective_to,
    change_reason: `Duplicated from v${source.version}`,
    params: source.params,
    created_by: user.id,
  }).select('id')

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: NOT_OPS }

  revalidatePath('/partner/policy')
  redirect(`/partner/policy/${data[0].id}`)
}
