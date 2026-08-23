import type { DocumentType } from '@/lib/types'

export const DOC_CATEGORIES = [
  { key: 'KYC', label: 'KYC — Identity & address', types: ['PAN_CARD', 'AADHAAR'] as DocumentType[] },
  { key: 'INCOME', label: 'Income proof', types: ['SALARY_SLIP', 'BANK_STATEMENT', 'ITR'] as DocumentType[] },
  { key: 'GST', label: 'GST', types: ['GST_RETURNS'] as DocumentType[] },
  { key: 'CREDIT', label: 'Credit', types: ['CREDIT_REPORT'] as DocumentType[] },
  { key: 'FINANCIALS', label: 'Financials & stock', types: ['FINANCIAL_STATEMENT', 'STOCK_STATEMENT'] as DocumentType[] },
  { key: 'PROPERTY', label: 'Property', types: ['PROPERTY_DEED', 'BUILDER_AGREEMENT', 'OCCUPANCY_CERTIFICATE', 'PROPERTY_VALUATION'] as DocumentType[] },
  { key: 'OTHER', label: 'Other', types: ['OTHER'] as DocumentType[] },
] as const

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  PAN_CARD: 'PAN Card',
  AADHAAR: 'Aadhaar Card',
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  PROPERTY_DEED: 'Property Title Deed',
  BUILDER_AGREEMENT: 'Builder Agreement / Allotment Letter',
  OCCUPANCY_CERTIFICATE: 'Occupancy Certificate',
  PROPERTY_VALUATION: 'Valuation Report',
  ITR: 'ITR (3 years)',
  GST_RETURNS: 'GST Returns',
  CREDIT_REPORT: 'Credit Bureau Report',
  STOCK_STATEMENT: 'Stock Statement',
  FINANCIAL_STATEMENT: 'Financial Statement',
  OTHER: 'Other',
}

export function categoryOf(type: DocumentType): string {
  return DOC_CATEGORIES.find((c) => (c.types as string[]).includes(type))?.key ?? 'OTHER'
}
