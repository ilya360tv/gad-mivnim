-- GAD MIVNIM - STEP 4: CV upload also accepts Word (DOC/DOCX), and length limits on public registration fields.
-- Bucket stays PRIVATE; anon may still only INSERT under incoming/<applicant uuid>/<file>; only admin may read.

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
