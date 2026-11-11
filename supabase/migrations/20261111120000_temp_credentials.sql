-- GAD MIVNIM - temporary passwords an admin can see until the contractor replaces them.
-- Rows are written only by the server (service_role, which bypasses RLS).
-- authenticated may SELECT, and only when private.is_admin() is true.
-- anon has no privileges. The table is not in the realtime publication.
-- A trigger on auth.users deletes the row when the password hash actually changes,
-- so a contractor cannot hide a still-valid password by calling an API.

create table if not exists public.temp_credentials (
  profile_id    uuid primary key references public.profiles(id) on delete cascade,
  temp_password text not null,
  created_at    timestamptz not null default now(),
  constraint temp_credentials_password_len check (char_length(temp_password) between 12 and 128)
);

comment on table public.temp_credentials is
  'Short-lived temporary login passwords. service_role writes them. Admins may SELECT. Removed when the auth password hash changes.';

alter table public.temp_credentials enable row level security;
alter table public.temp_credentials force row level security;

revoke all on table public.temp_credentials from public, anon, authenticated;
grant select on table public.temp_credentials to authenticated;
grant select, insert, update, delete on table public.temp_credentials to service_role;

drop policy if exists temp_credentials_admin_select on public.temp_credentials;
create policy temp_credentials_admin_select on public.temp_credentials
  for select
  to authenticated
  using ((select private.is_admin()));

create or replace function private.clear_temp_credential()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    delete from public.temp_credentials where profile_id = new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.clear_temp_credential() from public, anon, authenticated;
grant execute on function private.clear_temp_credential() to supabase_auth_admin;
grant usage on schema private to supabase_auth_admin;

drop trigger if exists on_auth_password_changed on auth.users;
create trigger on_auth_password_changed
  after update on auth.users
  for each row
  execute function private.clear_temp_credential();

do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'temp_credentials'
  ) then
    alter publication supabase_realtime drop table public.temp_credentials;
  end if;
end $$;

notify pgrst, 'reload schema';
