-- Content editor role: can manage ads + their media ONLY. Enforced by RLS (not just the screen).
-- Idempotent. Run once in the Supabase SQL editor.

-- ============ 1. profiles: role 'editor' + can_publish ============
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%in%'
  loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
end $$;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin','contractor','team','editor'));

alter table public.profiles add column if not exists can_publish boolean not null default false;

-- ============ 2. helper functions ============
create or replace function private.is_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'editor' and p.status = 'approved'
  );
$$;

create or replace function private.can_publish()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.status = 'approved'
      and (p.role = 'admin' or (p.role = 'editor' and p.can_publish))
  );
$$;

revoke all on function private.is_editor(), private.can_publish() from public, anon, authenticated;
grant execute on function private.is_editor() to authenticated;
grant execute on function private.can_publish() to authenticated;

-- ============ 3. ads: status / ownership / review ============
alter table public.ads add column if not exists status text not null default 'draft';
alter table public.ads drop constraint if exists ads_status_check;
alter table public.ads add constraint ads_status_check check (status in ('draft','pending','published'));
alter table public.ads add column if not exists created_by  uuid null references public.profiles(id) on delete set null;
alter table public.ads add column if not exists reviewed_by uuid null references public.profiles(id) on delete set null;
alter table public.ads add column if not exists reviewed_at timestamptz null;
alter table public.ads add column if not exists review_note text null;
create index if not exists ads_created_by_idx on public.ads (created_by);
create index if not exists ads_reviewed_by_idx on public.ads (reviewed_by);
create index if not exists ads_status_idx on public.ads (status);

-- existing ads (5 demo + GAD MIVNIM) stay live
update public.ads set status = 'published' where status = 'draft' and created_by is null and reviewed_at is null;

-- may the current editor edit this ad? (own non-published ad, or any ad when can_publish)
create or replace function private.editor_can_edit_ad(p_ad_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select private.is_editor() and exists (
    select 1 from public.ads a
    where a.id = p_ad_id
      and (private.can_publish() or (a.created_by = (select auth.uid()) and a.status <> 'published'))
  );
$$;

revoke all on function private.editor_can_edit_ad(uuid) from public, anon, authenticated;
grant execute on function private.editor_can_edit_ad(uuid) to authenticated;

-- public: only PUBLISHED ads (+ the old conditions)
drop policy if exists ads_public_select on public.ads;
create policy ads_public_select on public.ads for select to anon, authenticated
  using (
    status = 'published'
    and active
    and (starts_at is null or starts_at <= current_date)
    and (ends_at   is null or ends_at   >= current_date)
  );

-- editor policies
drop policy if exists ads_editor_select on public.ads;
create policy ads_editor_select on public.ads for select to authenticated
  using ((select private.is_editor()));

drop policy if exists ads_editor_insert on public.ads;
create policy ads_editor_insert on public.ads for insert to authenticated
  with check (
    (select private.is_editor())
    and created_by = (select auth.uid())
    and (status in ('draft','pending') or (status = 'published' and (select private.can_publish())))
  );

drop policy if exists ads_editor_update on public.ads;
create policy ads_editor_update on public.ads for update to authenticated
  using (
    (select private.is_editor())
    and ((select private.can_publish()) or (created_by = (select auth.uid()) and status <> 'published'))
  )
  with check (
    (select private.is_editor())
    and (status in ('draft','pending') or (select private.can_publish()))
  );

drop policy if exists ads_editor_delete on public.ads;
create policy ads_editor_delete on public.ads for delete to authenticated
  using ((select private.is_editor()) and created_by = (select auth.uid()) and status = 'draft');

-- columns an editor may never change (created_by / review fields); a rejected ad keeps the admin's note
create or replace function private.ads_guard_columns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;                                   -- server (service role) or admin
  end if;
  if tg_op = 'INSERT' then
    new.reviewed_by := null; new.reviewed_at := null; new.review_note := null;
    new.created_by := (select auth.uid());
  else
    new.created_by  := old.created_by;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.review_note := old.review_note;
    if new.status = 'published' and old.status <> 'published' and not private.can_publish() then
      raise exception 'not allowed to publish' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function private.ads_guard_columns() from public, anon, authenticated;

drop trigger if exists ads_guard_columns on public.ads;
create trigger ads_guard_columns before insert or update on public.ads
  for each row execute function private.ads_guard_columns();

-- ============ ad_cues: editor follows the host ad's rules ============
drop policy if exists ad_cues_public_select on public.ad_cues;
create policy ad_cues_public_select on public.ad_cues for select to anon, authenticated
  using (
    active
    and exists (select 1 from public.ads h where h.id = host_ad_id and h.status = 'published' and h.active
                and (h.starts_at is null or h.starts_at <= current_date) and (h.ends_at is null or h.ends_at >= current_date))
    and exists (select 1 from public.ads i where i.id = insert_ad_id and i.status = 'published' and i.active
                and (i.starts_at is null or i.starts_at <= current_date) and (i.ends_at is null or i.ends_at >= current_date))
  );

drop policy if exists ad_cues_editor_select on public.ad_cues;
create policy ad_cues_editor_select on public.ad_cues for select to authenticated
  using ((select private.is_editor()));
drop policy if exists ad_cues_editor_insert on public.ad_cues;
create policy ad_cues_editor_insert on public.ad_cues for insert to authenticated
  with check ((select private.editor_can_edit_ad(host_ad_id)));
drop policy if exists ad_cues_editor_update on public.ad_cues;
create policy ad_cues_editor_update on public.ad_cues for update to authenticated
  using ((select private.editor_can_edit_ad(host_ad_id)))
  with check ((select private.editor_can_edit_ad(host_ad_id)));
drop policy if exists ad_cues_editor_delete on public.ad_cues;
create policy ad_cues_editor_delete on public.ad_cues for delete to authenticated
  using ((select private.editor_can_edit_ad(host_ad_id)));

-- ============ 4. storage "site-ads": editor may write too (read stays public) ============
drop policy if exists site_ads_editor_insert on storage.objects;
create policy site_ads_editor_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-ads' and (select private.is_editor()));
drop policy if exists site_ads_editor_update on storage.objects;
create policy site_ads_editor_update on storage.objects for update to authenticated
  using (bucket_id = 'site-ads' and (select private.is_editor()))
  with check (bucket_id = 'site-ads' and (select private.is_editor()));
drop policy if exists site_ads_editor_delete on storage.objects;
create policy site_ads_editor_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-ads' and (select private.is_editor()));
-- (applicant-docs: only admin policies exist for select/update/delete; the editor gets nothing there)

-- ============ 5. self-check: every table must give an editor NOTHING ============
-- Run this SELECT after the migration: every row must show "ok".
-- select tablename, policyname, cmd, roles, qual from pg_policies where schemaname in ('public','storage') order by 1,2;
