-- User management + content managers. Idempotent. Run once in the Supabase SQL editor.
-- Content manager = role 'editor' + can_publish + status 'approved'. private.can_publish() is true for him and for admins.
-- He manages ALL site content (CMS tables, versions, media, ads). Contractor data and profiles stay private.is_admin() only.

-- ============ 1. CMS tables: content managers do everything the admin does ============
do $$
declare t text;
begin
  foreach t in array array['podcast_episodes','projects','in_progress','partners','info_articles','job_roles','gallery_items','page_blocks'] loop
    execute format('drop policy if exists %I on public.%I', t || '_manager_all', t);
    execute format($p$create policy %I on public.%I for all to authenticated using ((select private.can_publish())) with check ((select private.can_publish()))$p$, t || '_manager_all', t);
  end loop;
end $$;

drop policy if exists content_versions_manager_select on public.content_versions;
create policy content_versions_manager_select on public.content_versions for select to authenticated using ((select private.can_publish()));
drop policy if exists content_versions_manager_delete on public.content_versions;
create policy content_versions_manager_delete on public.content_versions for delete to authenticated using ((select private.can_publish()));

-- ============ 2. media bucket "site-media" ============
drop policy if exists site_media_manager_select on storage.objects;
create policy site_media_manager_select on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select private.can_publish()));
drop policy if exists site_media_manager_insert on storage.objects;
create policy site_media_manager_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select private.can_publish()));
drop policy if exists site_media_manager_update on storage.objects;
create policy site_media_manager_update on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select private.can_publish()))
  with check (bucket_id = 'site-media' and (select private.can_publish()));
drop policy if exists site_media_manager_delete on storage.objects;
create policy site_media_manager_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select private.can_publish()));

-- ============ 3. ads: a content manager may also delete any ad (select / insert / update already allowed) ============
drop policy if exists ads_manager_delete on public.ads;
create policy ads_manager_delete on public.ads for delete to authenticated
  using ((select private.can_publish()));

-- ============ 4. draft preview + recycle bin ============
create or replace function public.cms_preview()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.can_publish() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return jsonb_build_object(
      'podcast_episodes', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.podcast_episodes t where t.deleted_at is null), '[]'::jsonb),
      'projects', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.projects t where t.deleted_at is null), '[]'::jsonb),
      'in_progress', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.in_progress t where t.deleted_at is null), '[]'::jsonb),
      'partners', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.partners t where t.deleted_at is null), '[]'::jsonb),
      'info_articles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.info_articles t where t.deleted_at is null), '[]'::jsonb),
      'job_roles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.job_roles t where t.deleted_at is null), '[]'::jsonb),
      'gallery_items', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', true) order by t.sort_order, t.created_at) from public.gallery_items t where t.deleted_at is null), '[]'::jsonb),
      'page_blocks', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'type', t.type, 'value_he', t.value_he, 'value_en', t.value_en, 'value_ru', t.value_ru,
        'value_fr', t.value_fr, 'image_path', t.image_path, 'image_alt', t.image_alt) order by t.sort_order) from public.page_blocks t where t.deleted_at is null and (t.updated_by is not null or t.status = 'draft')), '[]'::jsonb)
  );
end $$;
revoke all on function public.cms_preview() from public, anon;
grant execute on function public.cms_preview() to authenticated;

create or replace function private.cms_purge_bin()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer := 0; c integer; t text;
begin
  if (select auth.uid()) is not null and not private.can_publish() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  foreach t in array array['podcast_episodes','projects','in_progress','partners','info_articles','job_roles','gallery_items','page_blocks'] loop
    execute format('delete from public.%I where deleted_at is not null and deleted_at < now() - interval ''30 days''', t);
    get diagnostics c = row_count;
    n := n + c;
  end loop;
  return n;
end $$;
revoke all on function private.cms_purge_bin() from public, anon;
grant execute on function private.cms_purge_bin() to authenticated;

-- Saving a page text failed with "permission denied for function cms_clean_text": the sanitizing trigger ran with the
-- caller's rights, and the caller may not execute the cleaning functions. It now runs with the owner's rights.
alter function private.cms_blocks_sanitize() security definer;

-- ============ 5. deleting a user must not change the site ============
-- The site shows a row from the database only when updated_by is set. When the account in updated_by is deleted
-- (foreign key "on delete set null"), the row moves to an active admin so the edited content stays on the site.
create or replace function private.cms_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.updated_by is null and old.updated_by is not null
     and not exists (select 1 from public.profiles p where p.id = old.updated_by) then
    new.updated_by := (select p.id from public.profiles p where p.role = 'admin' and p.status = 'approved' order by p.created_at limit 1);
    return new;
  end if;
  -- keep the previous version (also for soft delete / restore)
  insert into public.content_versions (table_name, row_id, snapshot, saved_by)
  values (tg_table_name, old.id, to_jsonb(old), (select auth.uid()));
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;
revoke all on function private.cms_before_update() from public, anon, authenticated;

-- ============ 6. the last active admin can never be removed, and an admin cannot remove himself ============
-- "active" = role admin, status approved, e-mail confirmed (an invitation that was not accepted does not count).
create or replace function private.protect_admins()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.role = 'admin' and old.status = 'approved' then
    if tg_op = 'UPDATE' then
      if new.role = 'admin' and new.status = 'approved' then
        return new;
      end if;
    end if;
    if old.id = (select auth.uid()) then
      raise exception 'cannot_change_self' using errcode = '42501';
    end if;
    perform pg_advisory_xact_lock(hashtext('gm:protect-admins'));      -- two admins removing each other at the same moment
    if not exists (
      select 1 from public.profiles p join auth.users u on u.id = p.id
      where p.id <> old.id and p.role = 'admin' and p.status = 'approved' and u.email_confirmed_at is not null
    ) then
      raise exception 'last_admin' using errcode = '23514';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function private.protect_admins() from public, anon, authenticated;

drop trigger if exists protect_admins on public.profiles;
create trigger protect_admins before update or delete on public.profiles
  for each row execute function private.protect_admins();
