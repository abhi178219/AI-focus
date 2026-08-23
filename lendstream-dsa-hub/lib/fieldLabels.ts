/**
 * Human labels for the lead columns the extractor can write.
 *
 * Lives outside the server-action file on purpose: a `'use server'` module may
 * only export async functions, so exporting this constant from there is a
 * runtime error that TypeScript does not catch.
 */
export const FIELD_LABELS: Record<string, string> = {
  monthly_income: 'Monthly income',
  property_value: 'Property value',
  pan_number: 'PAN',
  date_of_birth: 'Date of birth',
  aadhaar_last4: 'Aadhaar (last 4)',
  residence_address: 'Current residence',
  cibil_score: 'Bureau score',
  existing_emis: 'Existing obligations',
  gstin: 'GSTIN',
  business_name: 'Legal name',
  industry: 'Industry',
  company_pan: 'Company PAN',
  business_vintage_years: 'Vintage (years)',
}
