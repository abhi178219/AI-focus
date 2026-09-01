-- PAN is an identity attribute of the person, not the loan — promote it to
-- the Applicant, same as name/phone/email/address already are. Backfilled
-- from any of that Applicant's own existing Applications (leads) that
-- already has a real pan_number on file; never fabricated.
alter table public.applicants add column pan_number text;

update public.applicants a
set pan_number = l.pan_number
from (
  select distinct on (applicant_id) applicant_id, pan_number
  from public.leads
  where pan_number is not null
  order by applicant_id, created_at asc
) l
where l.applicant_id = a.id;
