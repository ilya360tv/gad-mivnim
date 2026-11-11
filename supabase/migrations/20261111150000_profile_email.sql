-- The contractor's real inbox, copied from the application when it is approved.
alter table public.profiles add column if not exists email text;
alter table public.profiles drop constraint if exists profiles_email_len;
alter table public.profiles add constraint profiles_email_len check (email is null or char_length(email) <= 200);

notify pgrst, 'reload schema';
