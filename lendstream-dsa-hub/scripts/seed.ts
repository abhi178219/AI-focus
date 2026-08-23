// Demo/dev seed data only.
import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(__dirname, '../.env.local') })
import { createClient } from '@supabase/supabase-js'
import { computeAssessment } from '../lib/decision/rulesEngine'
import type { DocumentRow, Lead, Product } from '../lib/types'

const SEED_PASSWORD = 'DemoPass123!'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function createUser(email: string, fullName: string, phone: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email, password: SEED_PASSWORD, email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  })
  if (error || !data.user) throw error
  return data.user.id
}

const REGIONS = ['Mumbai Central', 'Bengaluru South', 'Delhi NCR', 'Pune']
const AGENT_NAMES = ['Rajesh Kumar', 'Sneha Iyer', 'Arjun Mehta', 'Divya Nair']

async function main() {
  console.log('Creating ops admins...')
  const ops1 = await createUser('ops1@rupeeboss.demo', 'Priya Sharma', '9876543210')
  await supabase.from('profiles').update({ role: 'ops_admin' }).eq('id', ops1)
  const ops2 = await createUser('ops2@rupeeboss.demo', 'Vikram Rao', '9876543211')
  await supabase.from('profiles').update({ role: 'ops_admin' }).eq('id', ops2)

  console.log('Creating partner agents...')
  const agentIds: string[] = []
  for (let i = 0; i < AGENT_NAMES.length; i++) {
    const id = await createUser(`agent${i + 1}@rupeeboss.demo`, AGENT_NAMES[i], `98765432${20 + i}`)
    await supabase.from('profiles').update({ region: REGIONS[i], dsa_agreement_verified: true }).eq('id', id)
    agentIds.push(id)
  }

  console.log('Creating products...')
  const productRows = [
    { code: 'PL-STD', name: 'Personal Loan — Standard', category: 'PL', min_interest_rate: 11, max_interest_rate: 18, min_tenure_years: 1, max_tenure_years: 5, max_foir_percent: 50, min_salary_required: 25000, required_documents: ['PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'] },
    { code: 'PL-PREM', name: 'Personal Loan — Premium', category: 'PL', min_interest_rate: 10, max_interest_rate: 14, min_tenure_years: 1, max_tenure_years: 5, max_foir_percent: 45, min_salary_required: 75000, required_documents: ['PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'] },
    { code: 'HL-STD', name: 'Home Loan — Standard', category: 'HL', min_interest_rate: 8.5, max_interest_rate: 10.5, min_tenure_years: 5, max_tenure_years: 30, max_foir_percent: 55, max_ltv_percent: 80, min_salary_required: 30000, required_documents: ['PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DEED', 'ITR'] },
    { code: 'HL-AFF', name: 'Home Loan — Affordable Housing', category: 'HL', min_interest_rate: 8, max_interest_rate: 9.5, min_tenure_years: 5, max_tenure_years: 25, max_foir_percent: 60, max_ltv_percent: 90, min_salary_required: 20000, required_documents: ['PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT'] },
    { code: 'LAP-STD', name: 'Loan Against Property — Standard', category: 'LAP', min_interest_rate: 9.5, max_interest_rate: 12.5, min_tenure_years: 3, max_tenure_years: 15, max_foir_percent: 55, max_ltv_percent: 65, min_salary_required: 30000, required_documents: ['PAN_CARD', 'AADHAAR', 'BANK_STATEMENT', 'PROPERTY_DEED', 'ITR'] },
    { code: 'LAP-BIZ', name: 'Loan Against Property — Business', category: 'LAP', min_interest_rate: 10, max_interest_rate: 13.5, min_tenure_years: 3, max_tenure_years: 15, max_foir_percent: 50, max_ltv_percent: 60, min_salary_required: 40000, required_documents: ['PAN_CARD', 'AADHAAR', 'BANK_STATEMENT', 'PROPERTY_DEED', 'GST_RETURNS', 'ITR'] },
    { code: 'PL-SELF', name: 'Personal Loan — Self-Employed', category: 'PL', min_interest_rate: 13, max_interest_rate: 20, min_tenure_years: 1, max_tenure_years: 4, max_foir_percent: 45, min_salary_required: 35000, required_documents: ['PAN_CARD', 'AADHAAR', 'BANK_STATEMENT', 'GST_RETURNS', 'ITR'] },
    { code: 'HL-NRI', name: 'Home Loan — NRI', category: 'HL', min_interest_rate: 9, max_interest_rate: 11, min_tenure_years: 5, max_tenure_years: 20, max_foir_percent: 50, max_ltv_percent: 75, min_salary_required: 100000, required_documents: ['PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DEED'] },
  ]
  const { data: products, error: productsError } = await supabase.from('products').insert(productRows).select('*').returns<Product[]>()
  if (productsError || !products) throw productsError

  console.log('Creating commission slabs...')
  const banks = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra']
  const slabRows = banks.flatMap((bank) => ([
    { bank_name: bank, product_category: 'PL', slab_min_amount: 0, slab_max_amount: 500000, commission_percent: 1.5 },
    { bank_name: bank, product_category: 'PL', slab_min_amount: 500000, slab_max_amount: null, commission_percent: 2 },
    { bank_name: bank, product_category: 'HL', slab_min_amount: 0, slab_max_amount: 5000000, commission_percent: 0.4 },
    { bank_name: bank, product_category: 'HL', slab_min_amount: 5000000, slab_max_amount: null, commission_percent: 0.5 },
    { bank_name: bank, product_category: 'LAP', slab_min_amount: 0, slab_max_amount: null, commission_percent: 0.6 },
  ]))
  await supabase.from('commission_slabs').insert(slabRows)

  console.log('Creating leads...')
  const stages: Lead['stage'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'DOCUMENTATION', 'ASSESSMENT', 'LOGGED_IN', 'SANCTIONED', 'DISBURSED', 'DROPPED']
  const cities = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad']
  const names = [
    'Amit Shah', 'Neha Verma', 'Rohit Desai', 'Kavya Reddy', 'Suresh Pillai', 'Anjali Menon',
    'Karan Malhotra', 'Pooja Joshi', 'Vivek Bansal', 'Ritu Chawla', 'Manish Agarwal', 'Shreya Kapoor',
    'Deepak Chauhan', 'Priyanka Das', 'Nikhil Saxena', 'Meera Pillai', 'Ashish Jain', 'Sonal Gupta',
  ]

  const leadRows = names.map((name, i) => {
    const product = products[i % products.length]
    const stage = stages[i % stages.length]
    const isHL = product.category !== 'PL'
    const monthlyIncome = isHL ? 150000 + (i % 6) * 30000 : 35000 + (i % 6) * 15000
    const requestedAmount = isHL ? 2500000 + (i % 5) * 1500000 : 200000 + (i % 8) * 100000
    return {
      agent_id: agentIds[i % agentIds.length],
      client_name: name,
      phone: `98765${(40000 + i).toString().padStart(5, '0')}`,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      pan_number: `ABCDE${1000 + i}F`,
      loan_type: product.category as Lead['loan_type'],
      monthly_income: monthlyIncome,
      existing_emis: 5000 + (i % 4) * 3000,
      requested_amount: requestedAmount,
      tenure_years: isHL ? 15 : 3,
      property_value: isHL ? requestedAmount * (1.6 + (i % 5) * 0.35) : null,
      property_stage: isHL ? 'READY_TO_MOVE' : null,
      property_city: isHL ? cities[i % cities.length] : null,
      has_co_applicant: i % 3 === 0,
      co_applicant_income: i % 3 === 0 ? 20000 + (i % 4) * 8000 : null,
      stage,
      cibil_score: 620 + (i % 8) * 35,
      product_id: product.id,
      bank_assigned: stage === 'SANCTIONED' || stage === 'DISBURSED' ? banks[i % banks.length] : null,
      disbursed_amount: stage === 'DISBURSED' ? requestedAmount : null,
    }
  })

  const { data: leads, error: leadsError } = await supabase.from('leads').insert(leadRows).select('*').returns<Lead[]>()
  if (leadsError || !leads) throw leadsError

  console.log('Logging interactions...')
  const interactionRows = leads.slice(0, 12).map((lead, i) => ({
    lead_id: lead.id,
    agent_id: lead.agent_id,
    channel: ['CALL', 'WHATSAPP', 'EMAIL', 'BRANCH_MEETING', 'FIELD_VISIT'][i % 5],
    outcome: ['Interested', 'Follow-up needed', 'Docs requested', 'Awaiting decision'][i % 4],
    note: 'Auto-seeded interaction for demo.',
  }))
  await supabase.from('interactions').insert(interactionRows)

  console.log('Seeding documents + assessments for the first 6 leads (hand-authored extraction, real rules engine)...')
  for (let i = 0; i < 6; i++) {
    const lead = leads[i]
    const product = products.find((p) => p.id === lead.product_id)!

    const docs: Partial<DocumentRow>[] = [
      {
        lead_id: lead.id, type: 'PAN_CARD', name: 'pan_card.jpg', storage_path: `seed/${lead.id}/pan.jpg`,
        status: 'verified', ocr_text: `INCOME TAX DEPARTMENT\nPermanent Account Number Card\nName ${lead.client_name}\nPAN ${lead.pan_number}`,
        extracted_json: { name: lead.client_name, pan_number: lead.pan_number, dob: '1990-01-01' },
        extraction_model: 'seed-fixture', extraction_pipeline_version: 'v1', extraction_confidence: 1,
      },
      {
        lead_id: lead.id, type: 'BANK_STATEMENT', name: 'bank_statement.pdf', storage_path: `seed/${lead.id}/bank.pdf`,
        status: 'verified', ocr_text: `Statement of Account\nAccount Holder: ${lead.client_name}\nAvg monthly balance: ${lead.monthly_income}`,
        extracted_json: {
          account_holder_name: lead.client_name, account_number: `XXXX${1000 + i}`, bank_name: 'HDFC Bank',
          avg_monthly_balance: lead.monthly_income, monthly_credits: [lead.monthly_income], monthly_debits: [lead.existing_emis],
          salary_credits_detected: true,
        },
        extraction_model: 'seed-fixture', extraction_pipeline_version: 'v1', extraction_confidence: 0.9,
      },
    ]
    const { data: insertedDocs } = await supabase.from('documents').insert(docs).select('*').returns<DocumentRow[]>()

    const result = computeAssessment(lead, insertedDocs ?? [], product)
    const { data: assessment } = await supabase.from('assessments').insert({
      lead_id: lead.id,
      composite_score: result.composite_score,
      composite_band: result.composite_band,
      verdict: result.verdict,
      knockouts: result.knockouts,
      governing_capacity: result.governing_capacity,
      binding_constraint: result.binding_constraint,
      dscr: result.dscr,
      dscr_band: result.dscr_band,
      proposed_emi: result.proposed_emi,
      recommendation: result.recommendation,
      watch_items: result.watch_items,
      source_document_ids: (insertedDocs ?? []).map((d) => d.id),
      rules_version: 'v1',
    }).select('id').single()

    if (assessment) {
      const pillarRows = result.pillars.filter((p) => p.applicable).map((p) => ({
        assessment_id: assessment.id, pillar_code: p.pillar_code, score: p.score, band: p.band, headline: p.headline, signals: p.signals,
      }))
      if (pillarRows.length) await supabase.from('assessment_pillars').insert(pillarRows)
    }
    console.log(`  ${lead.client_name}: ${result.verdict} (${result.composite_band}, score ${result.composite_score})`)
  }

  console.log('Creating a couple of lender offers for logged-in+ leads...')
  const advancedLeads = leads.filter((l) => ['LOGGED_IN', 'SANCTIONED', 'DISBURSED'].includes(l.stage))
  for (const lead of advancedLeads.slice(0, 2)) {
    await supabase.from('lender_offers').insert([
      { lead_id: lead.id, bank_name: 'HDFC Bank', interest_rate: 11.5, tenure_years: lead.tenure_years ?? 3, approved_amount: lead.requested_amount, status: 'shared' },
      { lead_id: lead.id, bank_name: 'ICICI Bank', interest_rate: 12, tenure_years: lead.tenure_years ?? 3, approved_amount: lead.requested_amount * 0.9, status: 'draft' },
    ])
  }

  console.log('\nDone. Demo credentials (password for all: DemoPass123!):')
  console.log('  Ops:     ops1@rupeeboss.demo, ops2@rupeeboss.demo')
  console.log('  Partner: agent1@rupeeboss.demo .. agent4@rupeeboss.demo')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
