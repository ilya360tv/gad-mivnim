-- Contractor join flow: extra details, review statuses, and a private upload path.
-- Existing rows stay valid. Team and job registrations still insert status "pending"
-- with no upload token, and may still upload under incoming/their-id/.
-- A new contractor application sets upload_token_hash, so anonymous users cannot
-- write into that folder. Those files are uploaded with a service-role signed URL.
-- The bucket stays private. Only an admin can read objects.

alter table public.applicants drop constraint if exists applicants_status_check;
alter table public.applicants add constraint applicants_status_check
  check (status = any (array['draft','pending','approved','rejected','missing_docs','waitlist']));

alter table public.applicants
  add column if not exists entity_kind text,
  add column if not exists entity_other text,
  add column if not exists id_number text,
  add column if not exists contact_name text,
  add column if not exists contact_role text,
  add column if not exists address text,
  add column if not exists activity_areas text,
  add column if not exists license_info text,
  add column if not exists employee_count integer,
  add column if not exists signer_name text,
  add column if not exists signer_role text,
  add column if not exists agreed boolean not null default false,
  add column if not exists agreed_at timestamptz,
  add column if not exists upload_token_hash text,
  add column if not exists received_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists status_note text,
  add column if not exists submitted_at timestamptz;

update public.applicants
  set received_at = created_at
  where received_at is null and status <> 'draft';

alter table public.applicants drop constraint if exists applicants_entity_kind_check;
alter table public.applicants add constraint applicants_entity_kind_check
  check (entity_kind is null or entity_kind = any (array['contractor','company','professional','other']));

alter table public.applicants drop constraint if exists applicants_employee_count_check;
alter table public.applicants add constraint applicants_employee_count_check
  check (employee_count is null or (employee_count >= 0 and employee_count <= 100000));

alter table public.applicants drop constraint if exists applicants_join_lengths;
alter table public.applicants add constraint applicants_join_lengths check (
  (entity_other is null or char_length(entity_other) <= 80)
  and (id_number is null or char_length(id_number) <= 30)
  and (contact_name is null or char_length(contact_name) <= 120)
  and (contact_role is null or char_length(contact_role) <= 80)
  and (address is null or char_length(address) <= 200)
  and (activity_areas is null or char_length(activity_areas) <= 300)
  and (license_info is null or char_length(license_info) <= 160)
  and (signer_name is null or char_length(signer_name) <= 120)
  and (signer_role is null or char_length(signer_role) <= 80)
  and (reviewed_by is null or char_length(reviewed_by) <= 120)
  and (status_note is null or char_length(status_note) <= 2000)
  and (upload_token_hash is null or char_length(upload_token_hash) = 64)
);

alter table public.applicant_docs drop constraint if exists applicant_docs_doc_type_check;
alter table public.applicant_docs add constraint applicant_docs_doc_type_check
  check (doc_type = any (array[
    'license','projects','company','finance','recommendations','insurance','integrity','tax','cv',
    'incorporation','agreement'
  ]));

alter table public.applicant_docs add column if not exists file_name text;
alter table public.applicant_docs add column if not exists meets boolean;

alter table public.applicant_docs drop constraint if exists applicant_docs_file_name_len;
alter table public.applicant_docs add constraint applicant_docs_file_name_len
  check (file_name is null or char_length(file_name) <= 180);

-- Anonymous storage insert only for a pending application that has no upload token
-- (team, job, and older contractor registrations). Path must be that application's folder.
create or replace function private.storage_insert_ok(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applicants a
    where a.status = 'pending'
      and a.upload_token_hash is null
      and p_name like 'incoming/' || a.id::text || '/%'
  );
$$;

revoke all on function private.storage_insert_ok(text) from public, anon, authenticated;
grant execute on function private.storage_insert_ok(text) to anon, authenticated;

drop policy if exists applicant_docs_storage_insert on storage.objects;
create policy applicant_docs_storage_insert on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'applicant-docs'
    and name ~ '^incoming/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[^/]+[.](pdf|jpg|jpeg|png|doc|docx|PDF|JPG|JPEG|PNG|DOC|DOCX)$'
    and private.storage_insert_ok(name)
  );

notify pgrst, 'reload schema';
