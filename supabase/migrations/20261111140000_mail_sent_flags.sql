-- One-shot flags so registration and tender emails are not sent twice.
alter table public.applicants add column if not exists mail_sent_at timestamptz;
alter table public.tenders add column if not exists notified_at timestamptz;

notify pgrst, 'reload schema';
