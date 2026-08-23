import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { buildSections } from '@/lib/decision/sections'
import { buildQualityFactors } from '@/lib/decision/qualityFactors'
import type { ToolSpec } from '@/lib/agent/runtime'
import type { DocumentRow, Lead, Product } from '@/lib/types'

/**
 * Tools the agent may call. All read-only.
 *
 * Everything is fetched through the request-scoped Supabase client, so RLS
 * applies to the agent exactly as it applies to the signed-in user — the agent
 * cannot read a lead its caller could not.
 */

const num = { type: 'number' } as const
const str = { type: 'string' } as const

function objectSchema(props: Record<string, unknown>, required: string[]) {
  return { type: 'object', properties: props, required }
}

export function leadTools(leadId: string): ToolSpec[] {
  return [
    {
      name: 'get_lead',
      description: 'The applicant record: requested amount, tenure, income, obligations, bureau score, property, business profile.',
      parameters: objectSchema({}, []),
      run: async () => {
        const supabase = await createClient()
        const { data } = await supabase.from('leads').select('*').eq('id', leadId).single<Lead>()
        if (!data) return { error: 'Lead not found' }
        return {
          requested_amount: Number(data.requested_amount),
          tenure_years: data.tenure_years,
          loan_type: data.loan_type,
          monthly_income: data.monthly_income,
          existing_emis: data.existing_emis,
          cibil_score: data.cibil_score,
          property_value: data.property_value,
          has_co_applicant: data.has_co_applicant,
          co_applicant_income: data.co_applicant_income,
          business_name: data.business_name,
          business_vintage_years: data.business_vintage_years,
          business_constitution: data.business_constitution,
          industry: data.industry,
          employment_type: data.employment_type,
          stage: data.stage,
        }
      },
    },
    {
      name: 'get_sections',
      description: 'Per-section analysis derived from parsed documents: Banking, GST, Bureau, Financials, Business, Stock, Collateral — each with a band, headline and key figures. Sections with no document report status "missing".',
      parameters: objectSchema({}, []),
      run: async () => {
        const supabase = await createClient()
        const [{ data: lead }, { data: docs }] = await Promise.all([
          supabase.from('leads').select('*').eq('id', leadId).single<Lead>(),
          supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>(),
        ])
        if (!lead) return { error: 'Lead not found' }
        return buildSections(lead, docs ?? []).map((s) => ({
          section: s.key,
          status: s.status,
          band: s.band,
          headline: s.headline,
          figures: s.metrics.filter((m) => m.value !== null).map((m) => `${m.label}: ${m.value}`),
        }))
      },
    },
    {
      name: 'get_quality_factors',
      description: 'Banking/GST/counterparty signals that adjust confidence in the assessed capacity, and the resulting haircut.',
      parameters: objectSchema({}, []),
      run: async () => {
        const supabase = await createClient()
        const { data: docs } = await supabase.from('documents').select('*').eq('lead_id', leadId).returns<DocumentRow[]>()
        const q = buildQualityFactors(docs ?? [])
        return { haircut_percent: q.haircutPercent, factors: q.factors }
      },
    },
    {
      name: 'get_documents',
      description: 'Which documents are on file, their type, parse status and extraction confidence.',
      parameters: objectSchema({}, []),
      run: async () => {
        const supabase = await createClient()
        const { data } = await supabase
          .from('documents').select('id, type, name, status, extraction_confidence, uploaded_at')
          .eq('lead_id', leadId)
        return data ?? []
      },
    },
    {
      name: 'get_product_policy',
      description: 'Policy for the product family on this file: max FOIR, max LTV, rate band, tenure band, minimum income and required documents.',
      parameters: objectSchema({}, []),
      run: async () => {
        const supabase = await createClient()
        const { data: lead } = await supabase.from('leads').select('loan_type').eq('id', leadId).single()
        if (!lead) return { error: 'Lead not found' }
        const categories = lead.loan_type === 'BOTH' ? ['PL', 'HL'] : [lead.loan_type]
        const { data } = await supabase
          .from('products').select('*').in('category', categories).eq('is_active', true).returns<Product[]>()
        return (data ?? []).map((p) => ({
          name: p.name, category: p.category,
          max_foir_percent: p.max_foir_percent, max_ltv_percent: p.max_ltv_percent,
          min_interest_rate: p.min_interest_rate, max_interest_rate: p.max_interest_rate,
          min_tenure_years: p.min_tenure_years, max_tenure_years: p.max_tenure_years,
          min_salary_required: p.min_salary_required,
          required_documents: p.required_documents,
        }))
      },
    },
    {
      name: 'get_similar_decided_files',
      description: 'Previously decided files with a comparable profile and their recorded real-world outcome. Use to sanity-check a call against what actually happened before.',
      parameters: objectSchema({ limit: num }, []),
      run: async (args: { limit?: number }) => {
        const supabase = await createClient()
        const { data: lead } = await supabase.from('leads').select('loan_type, requested_amount').eq('id', leadId).single()
        if (!lead) return { error: 'Lead not found' }
        const target = Number(lead.requested_amount)
        const { data } = await supabase
          .from('decision_outcomes')
          .select('predicted_verdict, predicted_score, actual_outcome, actual_amount, leads!inner(loan_type, requested_amount, cibil_score)')
          .eq('leads.loan_type', lead.loan_type)
          .limit(Math.min(args.limit ?? 8, 25))
        // Nearest by ticket size — a like-for-like comparison, not a random sample.
        return (data ?? [])
          .map((r) => {
            const l = r.leads as unknown as { requested_amount: number; cibil_score: number | null }
            return { ...r, leads: undefined, requested_amount: Number(l.requested_amount), cibil_score: l.cibil_score }
          })
          .sort((a, b) => Math.abs(a.requested_amount - target) - Math.abs(b.requested_amount - target))
      },
    },
    {
      name: 'get_learned_policy',
      description: 'Approved policy adjustments learned from past outcomes. Only human-approved entries are returned; proposals are not in force.',
      parameters: objectSchema({ scope: str }, []),
      run: async (args: { scope?: string }) => {
        const supabase = await createClient()
        let q = supabase.from('learned_policies').select('scope, rule_key, proposal, rationale, evidence_count').eq('status', 'approved')
        if (args.scope) q = q.eq('scope', args.scope)
        const { data } = await q
        return data ?? []
      },
    },
  ]
}

/** Correction history for a document type — the extraction agent's few-shot memory. */
export function correctionTools(documentType: string): ToolSpec[] {
  return [
    {
      name: 'get_past_corrections',
      description: 'Fields users have previously corrected on this document type, with the wrong value and the corrected one. Use these to avoid repeating known mistakes.',
      parameters: objectSchema({ field: str }, []),
      run: async (args: { field?: string }) => {
        const supabase = await createClient()
        let q = supabase
          .from('extraction_corrections')
          .select('field, extracted_value, corrected_value, kind, created_at')
          .eq('document_type', documentType)
          .eq('kind', 'overwrite')
          .order('created_at', { ascending: false })
          .limit(20)
        if (args.field) q = q.eq('field', args.field)
        const { data } = await q
        return data ?? []
      },
    },
  ]
}
