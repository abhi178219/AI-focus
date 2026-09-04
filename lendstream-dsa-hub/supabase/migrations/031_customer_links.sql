-- Customer-facing links — the first PUBLIC, unauthenticated write path in this
-- app. One row is one capability handed to one customer for one lead: "you may
-- record consent for this applicant" or "you may upload documents onto this
-- file", for seven days.
--
-- SECURITY MODEL — the token is a BEARER CAPABILITY, not an identifier.
--
-- 1. `token` is a uuid with a `gen_random_uuid()` default: 122 bits of
--    cryptographically-random value, minted by Postgres itself. It is the ONLY
--    thing that authorises a public request. Nothing else about a public
--    request is trusted — never a lead_id, applicant_id or agent_id sent
--    alongside it. Every public server action resolves the token to THIS row
--    and scopes every subsequent read and write to the lead_id/applicant_id
--    this row names.
--
-- 2. The two policies below are for the AUTHENTICATED side only — an agent (or
--    ops) creating and reviewing links on their own leads. There is
--    deliberately NO policy granting `anon` (or `public`) select or insert on
--    this table. If there were, anyone could hit the Supabase REST API directly
--    and enumerate every live link, bypassing the Next.js pages entirely.
--    Public access runs exclusively through `createServiceClient()` inside
--    app/actions/publicSubmissions.ts, which re-validates token + expiry +
--    purpose before touching anything else.
--
-- 3. No update and no delete policy: like `documents` and `applicant_consents`,
--    a link row is an append-only record of what was issued and when. A link is
--    retired by expiring, not by being edited away.
--
-- Every policy uses `private.is_ops_admin()` — `public.is_ops_admin()` had
-- EXECUTE revoked from authenticated/anon in 004_harden_rls_execute.sql and any
-- policy calling it denies silently (see 017).

create table public.customer_links (
  id uuid primary key default gen_random_uuid(),
  -- Unique so a token resolves to at most one row; the DB default is the only
  -- place a token is ever minted.
  token uuid not null default gen_random_uuid() unique,
  purpose text not null check (purpose in ('CONSENT', 'DOCUMENT_UPLOAD')),
  lead_id uuid not null references public.leads(id) on delete cascade,
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  -- The agent who generated and sent this link. A consent captured through it
  -- is stamped `captured_by = created_by`: a customer has no profiles row, and
  -- the agent is genuinely the accountable party for having sent the link.
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index customer_links_lead_purpose_idx
  on public.customer_links (lead_id, purpose, created_at desc);

alter table public.customer_links enable row level security;

create policy "customer_links_select_via_lead" on public.customer_links for select to authenticated
  using (exists (
    select 1 from public.leads l
    where l.id = customer_links.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())
  ));

-- Same shape as documents_insert_via_lead (004): ops may issue too, but the
-- `created_by` stamp must be honest.
create policy "customer_links_insert_via_lead" on public.customer_links for insert to authenticated
  with check (
    (private.is_ops_admin() or created_by = auth.uid())
    and exists (
      select 1 from public.leads l
      where l.id = customer_links.lead_id and (l.agent_id = auth.uid() or private.is_ops_admin())
    )
  );
