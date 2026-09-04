-- Reporting hierarchy on a profile (RM) — who their Team Manager and Business
-- Head are. Free-text name/phone, not a self-reference to another profile:
-- this app has exactly two roles (dsa_partner, ops_admin) with no distinct
-- "team manager"/"business head" login, so these are escalation-contact facts
-- about the RM, not real accounts. Shown on the Applicant page's Relationship
-- manager card, since that's the RM's own detail card wherever a file happens
-- to be open.

alter table public.profiles
  add column team_manager_name text,
  add column team_manager_phone text,
  add column business_head_name text,
  add column business_head_phone text;

-- profiles has a COLUMN-LEVEL grant (002_rls.sql) restricting which columns
-- `authenticated` may update at all, independent of the RLS policy — the RLS
-- policy alone is not enough. Forgetting this grant is the equivalent gotcha
-- to the private.is_ops_admin() one for this specific table: the update will
-- silently affect zero rows rather than error.
grant update (team_manager_name, team_manager_phone, business_head_name, business_head_phone)
  on public.profiles to authenticated;
