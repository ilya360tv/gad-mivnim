-- GAD MIVNIM - STEP 3: user codes for the approval function (api/approve.js)
-- The server function uses the service_role key, so auth.uid() is null there and
-- private.next_user_code() (admin-only via is_admin()) cannot be used. This wrapper is
-- callable ONLY by service_role (never by anon / authenticated) and uses the same sequence.

create or replace function public.next_user_code()
returns text language sql volatile security definer set search_path = ''
as $$
  select 'GM-' || nextval('private.user_code_seq')::text;
$$;

revoke all on function public.next_user_code() from public, anon, authenticated;
grant execute on function public.next_user_code() to service_role;
