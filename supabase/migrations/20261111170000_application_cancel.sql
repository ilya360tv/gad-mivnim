-- A contractor can cancel their own participation. Admins already have full access.
drop policy if exists applications_own_delete on public.applications;
create policy applications_own_delete on public.applications
  for delete to authenticated
  using (profile_id = (select auth.uid()));
