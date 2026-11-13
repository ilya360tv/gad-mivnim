-- GAD MIVNIM - house-contractor join = digital agreement + documents + signature -> admin review -> billing hooks.
-- Runs AFTER 20261111180000_contractor_join.sql (already merged) and reuses its columns:
--   applicants: entity_kind, entity_other, id_number, contact_name, contact_role, address, activity_areas,
--               license_info, employee_count, signer_name, signer_role, agreed, agreed_at, submitted_at,
--               received_at, reviewed_by, status_note (= docs request / reject reason), upload_token_hash
--   applicant_docs: file_name, meets;   doc types 'incorporation' + 'agreement' already allowed.
-- Safe to re-run: only "if not exists" / "drop ... if exists" + re-create.
-- New rows are written ONLY by the server (api/submit-application.js, service_role) so the IP / user agent /
-- accepted_at / agreement hash are captured server-side and never trusted from the browser.
-- Every new table: RLS on, admin-only policies, no anon / contractor access at all.
-- The storage bucket "applicant-docs" stays PRIVATE (admin reads via 5-minute signed URLs).

-- ============ applicants: review workflow (only columns the merged migration does not have) ============
alter table public.applicants
  add column if not exists review_checks     jsonb not null default '{}'::jsonb,
  add column if not exists review_notes      text,
  add column if not exists reviewed_at       timestamptz,
  add column if not exists status_changed_at timestamptz;

-- statuses = everything the merged migration allows + 'submitted' and 'in_review'
alter table public.applicants drop constraint if exists applicants_status_check;
alter table public.applicants add constraint applicants_status_check
  check (status = any (array['draft','pending','submitted','in_review','missing_docs','waitlist','approved','rejected']));

alter table public.applicants drop constraint if exists applicants_review_lengths;
alter table public.applicants add constraint applicants_review_lengths
  check (review_notes is null or char_length(review_notes) <= 4000);

-- ============ applicant_docs: admin check per document ============
alter table public.applicant_docs
  add column if not exists checked_by_admin boolean not null default false,
  add column if not exists admin_note       text,
  add column if not exists checked_by       text,
  add column if not exists checked_at       timestamptz,
  add column if not exists file_size        int;

alter table public.applicant_docs drop constraint if exists applicant_docs_note_len;
alter table public.applicant_docs add constraint applicant_docs_note_len
  check ((admin_note is null or char_length(admin_note) <= 1000)
     and (checked_by is null or char_length(checked_by) <= 200)
     and (file_size is null or file_size between 0 and 10485760));

-- ============ agreement_acceptances ============
create table if not exists public.agreement_acceptances (
  id                     uuid primary key default gen_random_uuid(),
  applicant_id           uuid not null unique references public.applicants(id) on delete cascade,
  agreement_version      text not null,
  agreement_sha256       text not null check (agreement_sha256 ~ '^[0-9a-f]{64}$'),
  accepted_at            timestamptz not null default now(),
  consent_read           boolean not null,
  consent_review_fee     boolean not null,
  consent_annual         boolean not null,
  consent_confidentiality boolean not null,
  consent_privacy        boolean not null,
  signer_name            text not null check (char_length(signer_name) between 2 and 120),
  signer_role            text check (signer_role is null or char_length(signer_role) <= 80),
  signing_city           text check (signing_city is null or char_length(signing_city) <= 80),
  signature_path         text not null,
  pdf_path               text,
  html_path              text,
  ip_address             text,
  user_agent             text check (user_agent is null or char_length(user_agent) <= 500),
  constraint agreement_all_consents check (consent_read and consent_review_fee and consent_annual and consent_confidentiality and consent_privacy)
);
create index if not exists agreement_acceptances_ip_idx on public.agreement_acceptances(ip_address, accepted_at);

-- ============ billing (data model + hooks only, no real charging yet) ============
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  applicant_id            uuid not null unique references public.applicants(id) on delete cascade,
  profile_id              uuid references public.profiles(id) on delete set null,
  plan                    text not null default 'annual-monthly' check (plan in ('annual-monthly')),
  monthly_amount          numeric(10,2) not null default 0 check (monthly_amount >= 0),
  status                  text not null default 'awaiting_payment'
                          check (status in ('awaiting_payment','review_fee_charged','active','rejected_closed','suspended')),
  started_at              timestamptz,
  ends_at                 timestamptz,
  provider                text,
  provider_customer_token text,           -- a TOKEN from the payment provider only. Never card numbers / CVV.
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint subscriptions_period check (ends_at is null or started_at is null or ends_at > started_at)
);
create index if not exists subscriptions_profile_id_idx on public.subscriptions(profile_id);

create table if not exists public.charges (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  amount          numeric(10,2) not null check (amount >= 0),
  kind            text not null check (kind in ('review_fee','monthly')),
  installment     int check (installment is null or installment between 1 and 12),
  status          text not null default 'scheduled'
                  check (status in ('awaiting_provider','scheduled','paid','failed','canceled')),
  due_at          timestamptz,
  provider_ref    text,
  created_at      timestamptz not null default now()
);
create index if not exists charges_subscription_id_idx on public.charges(subscription_id);

-- ============ grants + RLS (admin only; no anon, no contractor) ============
revoke all on public.agreement_acceptances, public.subscriptions, public.charges from anon, authenticated;
grant select on public.agreement_acceptances to authenticated;
grant select, insert, update, delete on public.subscriptions, public.charges to authenticated;

alter table public.agreement_acceptances enable row level security;
alter table public.subscriptions         enable row level security;
alter table public.charges               enable row level security;

-- the agreement itself is immutable once signed (admin may read, never edit; the server writes it)
drop policy if exists agreement_acceptances_admin_all on public.agreement_acceptances;
drop policy if exists agreement_acceptances_admin_select on public.agreement_acceptances;
create policy agreement_acceptances_admin_select on public.agreement_acceptances for select to authenticated
  using ((select private.is_admin()));

drop policy if exists subscriptions_admin_all on public.subscriptions;
create policy subscriptions_admin_all on public.subscriptions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists charges_admin_all on public.charges;
create policy charges_admin_all on public.charges for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- NOTE: the public insert policy on applicants is NOT changed here, so the live contractor form keeps
-- working until the wizard is deployed. Tightening it (team/job only) is in 20261113090000_contractor_lockdown.sql,
-- to run right after the merge to main.

notify pgrst, 'reload schema';
