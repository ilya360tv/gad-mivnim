-- Run ONLY after the contractor wizard is live on main (it submits via /api/submit-application, service_role).
-- From now on house contractors join only through the signed-agreement flow; the public form may still
-- insert team / job rows. Safe to re-run.
drop policy if exists applicants_public_insert on public.applicants;
create policy applicants_public_insert on public.applicants for insert to anon, authenticated
  with check (status = 'pending' and profile_id is null and type in ('team','job'));

notify pgrst, 'reload schema';
