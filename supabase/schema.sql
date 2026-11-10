-- GAD MIVNIM - initial schema (TASK-supabase.md STEP 1)
-- Idempotent where practical. Helpers live in schema "private" (not exposed by PostgREST).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ============ TABLES ============
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'contractor' check (role in ('admin','contractor','team')),
  full_name     text,
  phone         text,
  fields        text[] not null default '{קבלן כללי}',
  user_code     text unique,
  status        text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  subscription  text not null default 'none' check (subscription in ('active','none')),
  created_at    timestamptz not null default now()
);

create table if not exists public.applicants (
  id               uuid primary key default gen_random_uuid(),
  type             text not null check (type in ('contractor','team','job')),
  role_slug        text,
  full_name        text not null,
  phone            text not null,
  email            text,
  fields           text[],
  experience_years int check (experience_years is null or experience_years >= 0),
  work_area        text,
  note             text,
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  profile_id       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists applicants_profile_id_idx on public.applicants(profile_id);
create index if not exists applicants_status_idx on public.applicants(status);

create table if not exists public.applicant_docs (
  id            uuid primary key default gen_random_uuid(),
  applicant_id  uuid not null references public.applicants(id) on delete cascade,
  doc_type      text not null check (doc_type in ('license','projects','company','finance','recommendations','insurance','integrity','tax','cv')),
  storage_path  text not null,
  created_at    timestamptz not null default now()
);
create index if not exists applicant_docs_applicant_id_idx on public.applicant_docs(applicant_id);

create table if not exists public.tenders (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  field        text not null,
  location     text,
  description  text,
  open_date    date,
  deadline     date,
  status       text not null default 'draft' check (status in ('draft','published','closed')),
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  constraint tenders_deadline_after_open check (deadline is null or open_date is null or deadline >= open_date)
);
create index if not exists tenders_created_by_idx on public.tenders(created_by);
create index if not exists tenders_status_field_idx on public.tenders(status, field);

create table if not exists public.applications (
  id          uuid primary key default gen_random_uuid(),
  tender_id   uuid not null references public.tenders(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  note        text,
  created_at  timestamptz not null default now(),
  constraint applications_tender_profile_key unique (tender_id, profile_id)
);
create index if not exists applications_profile_id_idx on public.applications(profile_id);

-- ============ USER CODES ============
create sequence if not exists private.user_code_seq start with 1001 minvalue 1001;

-- ============ HELPER FUNCTIONS (SECURITY DEFINER, pinned search_path) ============
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'approved'
  );
$$;

-- approved contractor with active subscription whose fields cover the given field
create or replace function private.can_see_field(p_field text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'contractor' and p.status = 'approved' and p.subscription = 'active'
      and (p_field = any(p.fields) or 'קבלן כללי' = any(p.fields))
  );
$$;

create or replace function private.can_see_tender(p_tender_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.tenders t
    where t.id = p_tender_id and t.status = 'published' and private.can_see_field(t.field)
  );
$$;

-- used by applicant_docs insert policy (anon cannot SELECT applicants)
create or replace function private.applicant_is_pending(p_applicant_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.applicants a where a.id = p_applicant_id and a.status = 'pending');
$$;

-- next user code (GM-1001, GM-1002, ...) - admin only, for the future approval function
create or replace function private.next_user_code()
returns text language plpgsql volatile security definer set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return 'GM-' || nextval('private.user_code_seq')::text;
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_see_field(text) to authenticated;
grant execute on function private.can_see_tender(uuid) to authenticated;
grant execute on function private.next_user_code() to authenticated;
grant execute on function private.applicant_is_pending(uuid) to anon, authenticated;
revoke all on sequence private.user_code_seq from public, anon, authenticated;

-- ============ GRANTS (RLS does the row filtering) ============
revoke all on public.profiles, public.applicants, public.applicant_docs, public.tenders, public.applications from anon, authenticated;
grant insert on public.applicants, public.applicant_docs to anon;
grant select, insert, update, delete on public.profiles, public.applicants, public.applicant_docs, public.tenders, public.applications to authenticated;

-- ============ RLS ============
alter table public.profiles       enable row level security;
alter table public.applicants     enable row level security;
alter table public.applicant_docs enable row level security;
alter table public.tenders        enable row level security;
alter table public.applications   enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- applicants
drop policy if exists applicants_public_insert on public.applicants;
create policy applicants_public_insert on public.applicants for insert to anon, authenticated
  with check (status = 'pending' and profile_id is null);
drop policy if exists applicants_admin_all on public.applicants;
create policy applicants_admin_all on public.applicants for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- applicant_docs
drop policy if exists applicant_docs_public_insert on public.applicant_docs;
create policy applicant_docs_public_insert on public.applicant_docs for insert to anon, authenticated
  with check (
    private.applicant_is_pending(applicant_id)
    and storage_path like 'incoming/' || applicant_id::text || '/%'
  );
drop policy if exists applicant_docs_admin_all on public.applicant_docs;
create policy applicant_docs_admin_all on public.applicant_docs for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- tenders
drop policy if exists tenders_contractor_select on public.tenders;
create policy tenders_contractor_select on public.tenders for select to authenticated
  using (status = 'published' and private.can_see_field(field));
drop policy if exists tenders_admin_all on public.tenders;
create policy tenders_admin_all on public.tenders for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- applications
drop policy if exists applications_own_select on public.applications;
create policy applications_own_select on public.applications for select to authenticated
  using (profile_id = (select auth.uid()));
drop policy if exists applications_own_insert on public.applications;
create policy applications_own_insert on public.applications for insert to authenticated
  with check (profile_id = (select auth.uid()) and private.can_see_tender(tender_id));
drop policy if exists applications_admin_all on public.applications;
create policy applications_admin_all on public.applications for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============ STORAGE ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('applicant-docs', 'applicant-docs', false, 5242880, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists applicant_docs_storage_insert on storage.objects;
create policy applicant_docs_storage_insert on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'applicant-docs'
    and name ~ '^incoming/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[^/]+\.(pdf|jpg|jpeg|png|PDF|JPG|JPEG|PNG)$'
  );
drop policy if exists applicant_docs_storage_admin_select on storage.objects;
create policy applicant_docs_storage_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'applicant-docs' and (select private.is_admin()));
drop policy if exists applicant_docs_storage_admin_update on storage.objects;
create policy applicant_docs_storage_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'applicant-docs' and (select private.is_admin()))
  with check (bucket_id = 'applicant-docs' and (select private.is_admin()));
drop policy if exists applicant_docs_storage_admin_delete on storage.objects;
create policy applicant_docs_storage_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'applicant-docs' and (select private.is_admin()));

-- ============ STEP 3: user codes for the approval function (see migration 20261109130000) ============
create or replace function public.next_user_code()
returns text language sql volatile security definer set search_path = ''
as $$
  select 'GM-' || nextval('private.user_code_seq')::text;
$$;
revoke all on function public.next_user_code() from public, anon, authenticated;
grant execute on function public.next_user_code() to service_role;

-- ============ STEP 4: Word CVs + length limits (see migration 20261110100000) ============

update storage.buckets
set allowed_mime_types = array[
  'application/pdf', 'image/jpeg', 'image/png',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]
where id = 'applicant-docs';

drop policy if exists applicant_docs_storage_insert on storage.objects;
create policy applicant_docs_storage_insert on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'applicant-docs'
    and name ~ '^incoming/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[^/]+\.(pdf|jpg|jpeg|png|doc|docx|PDF|JPG|JPEG|PNG|DOC|DOCX)$'
  );

-- anti-abuse limits for anonymous registrations
alter table public.applicants drop constraint if exists applicants_lengths;
alter table public.applicants add constraint applicants_lengths check (
  char_length(full_name) between 1 and 120
  and char_length(phone) between 1 and 30
  and (email is null or char_length(email) <= 200)
  and (role_slug is null or char_length(role_slug) <= 60)
  and (work_area is null or char_length(work_area) <= 120)
  and (note is null or char_length(note) <= 2000)
  and (fields is null or cardinality(fields) <= 3)
);
alter table public.applications drop constraint if exists applications_note_len;
alter table public.applications add constraint applications_note_len check (note is null or char_length(note) <= 2000);
