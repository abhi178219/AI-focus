-- Add a PROPERTY_VALUATION document type (valuation reports), and mark which
-- lead fields were auto-applied from a parsed document vs. entered by hand —
-- needed so the UI can show provenance without guessing.
alter table public.documents drop constraint documents_type_check;
alter table public.documents add constraint documents_type_check check (type in (
  'PAN_CARD', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT', 'PROPERTY_DEED',
  'BUILDER_AGREEMENT', 'OCCUPANCY_CERTIFICATE', 'PROPERTY_VALUATION', 'ITR', 'GST_RETURNS', 'OTHER'
));

alter table public.leads add column fields_from_documents text[] not null default '{}';
