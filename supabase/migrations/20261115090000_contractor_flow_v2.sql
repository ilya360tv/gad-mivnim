-- GAD MIVNIM - contractor wizard v2: notification channels + secure "upload missing documents" link.
-- Safe to re-run. Run by hand in the Supabase SQL editor (the MCP cannot see this project).
alter table public.applicants
  add column if not exists notify_channels      text[],
  add column if not exists docs_requested       text[],
  add column if not exists resubmit_token_hash  text,
  add column if not exists resubmit_expires_at  timestamptz;

alter table public.applicants drop constraint if exists applicants_notify_channels_check;
alter table public.applicants add constraint applicants_notify_channels_check
  check (notify_channels is null or notify_channels <@ array['email','sms','whatsapp']::text[]);

alter table public.applicants drop constraint if exists applicants_resubmit_hash_len;
alter table public.applicants add constraint applicants_resubmit_hash_len
  check (resubmit_token_hash is null or char_length(resubmit_token_hash) = 64);

notify pgrst, 'reload schema';
