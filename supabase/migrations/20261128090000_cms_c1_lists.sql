-- CMS stage C1: the data-driven lists move to the database (podcast, projects, in-progress, partners, info, careers, gallery).
-- Public may read ONLY published, non-deleted rows. Only private.is_admin() writes. Idempotent.
-- Every row: status draft|published, sort_order, updated_at/updated_by, soft delete (deleted_at = recycle bin, 30 days).
-- Hebrew is in the typed *_he columns; en/ru/fr optional in i18n jsonb ({"en":{"title":..},"ru":{..},"fr":{..}}); if empty the site falls back to the built-in text.

-- ============ tables ============
create table if not exists public.podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  number integer not null check (number > 0),
  minutes integer check (minutes is null or minutes >= 0),
  title_he text not null check (char_length(title_he) between 1 and 200),
  guest_he text,
  description_he text,
  points_he text[] not null default '{}',
  cover_path text,
  cover_alt text,
  video_url text check (video_url is null or video_url ~ '^(https://|/|images/|video/)'),
  audio_path text,
  published_on date,
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint podcast_cover_alt check (cover_path is null or char_length(coalesce(cover_alt,'')) > 0)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sector text not null check (sector in ('private','business-private','business-public')),
  client_name_he text not null check (char_length(client_name_he) between 1 and 200),
  subtitle_he text,
  city_he text,
  logo text,
  title_he text,
  items_he text[] not null default '{}',
  description_he text,
  gallery jsonb not null default '[]',        -- [{ "src": "images/..", "alt": "..", "width": 1224, "height": 1600 }]
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.in_progress (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_he text not null check (char_length(name_he) between 1 and 200),
  location_he text,
  progress integer not null default 0 check (progress between 0 and 100),
  image_path text,
  image_alt text,
  title_he text,
  items_he text[] not null default '{}',
  gallery jsonb not null default '[]',
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint in_progress_alt check (image_path is null or char_length(coalesce(image_alt,'')) > 0)
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- category key = data-slug of the card (kitchens, tiles, ...)
  title_he text not null check (char_length(title_he) between 1 and 200),
  slogan_he text,
  image_path text,
  image_alt text,
  link_page text check (link_page is null or link_page ~ '^(https://|/|[a-z0-9-]+\.html)'),
  photos jsonb not null default '[]',         -- gallery of the card window: [{ "src": "..", "alt": ".." }]
  content_he text,
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint partners_alt check (image_path is null or char_length(coalesce(image_alt,'')) > 0)
);

create table if not exists public.info_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon_svg text,                              -- inner SVG paths (viewBox 0 0 24 24); sanitized on the server in the studio
  title_he text not null check (char_length(title_he) between 1 and 300),
  card_text_he text,
  intro_he text,
  bullets_he text[] not null default '{}',
  tip_he text,
  image_path text,
  image_alt text,
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint info_alt check (image_path is null or char_length(coalesce(image_alt,'')) > 0)
);

create table if not exists public.job_roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- r1..r4 (= data-role of the card)
  title_he text not null check (char_length(title_he) between 1 and 200),
  subtitle_he text,
  intro_he text,
  requirements_he text[] not null default '{}',
  advantages_he text[] not null default '{}',
  offer_he text[] not null default '{}',      -- "what we offer" (same for every role; stored on each row, editable per role)
  active boolean not null default true,
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  image_path text not null,
  alt_text text not null check (char_length(alt_text) between 1 and 200),
  category text,                              -- project slug / sector the image belongs to
  width integer,
  height integer,
  i18n jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

-- ============ version history (admin only) ============
create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  row_id uuid not null,
  snapshot jsonb not null,
  saved_at timestamptz not null default now(),
  saved_by uuid references public.profiles(id) on delete set null
);
create index if not exists content_versions_row_idx on public.content_versions (table_name, row_id, saved_at desc);
create index if not exists content_versions_saved_by_idx on public.content_versions (saved_by);

-- ============ triggers / helpers ============
create or replace function private.cms_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- keep the previous version (also for soft delete / restore)
  insert into public.content_versions (table_name, row_id, snapshot, saved_by)
  values (tg_table_name, old.id, to_jsonb(old), (select auth.uid()));
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end $$;

create or replace function private.cms_before_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.content_versions (table_name, row_id, snapshot, saved_by)
  values (tg_table_name, old.id, to_jsonb(old), (select auth.uid()));
  return old;
end $$;

-- permanent removal of items that stayed in the recycle bin for 30 days (call from the studio / a scheduled job)
create or replace function private.cms_purge_bin()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer := 0; c integer; t text;
begin
  if (select auth.uid()) is not null and not private.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  foreach t in array array['podcast_episodes','projects','in_progress','partners','info_articles','job_roles','gallery_items'] loop
    execute format('delete from public.%I where deleted_at is not null and deleted_at < now() - interval ''30 days''', t);
    get diagnostics c = row_count;
    n := n + c;
  end loop;
  return n;
end $$;

revoke all on function private.cms_before_update(), private.cms_before_delete(), private.cms_purge_bin() from public, anon, authenticated;
grant execute on function private.cms_purge_bin() to authenticated;

-- ============ RLS + grants + triggers for every content table ============
do $$
declare t text;
begin
  foreach t in array array['podcast_episodes','projects','in_progress','partners','info_articles','job_roles','gallery_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);

    execute format('drop policy if exists %I on public.%I', t || '_public_select', t);
    execute format($p$create policy %I on public.%I for select to anon, authenticated using (status = 'published' and deleted_at is null)$p$, t || '_public_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format($p$create policy %I on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))$p$, t || '_admin_all', t);

    execute format('create index if not exists %I on public.%I (sort_order, created_at)', t || '_sort_idx', t);
    execute format('create index if not exists %I on public.%I (updated_by)', t || '_updated_by_idx', t);

    execute format('drop trigger if exists cms_before_update on public.%I', t);
    execute format('create trigger cms_before_update before update on public.%I for each row execute function private.cms_before_update()', t);
    execute format('drop trigger if exists cms_before_delete on public.%I', t);
    execute format('create trigger cms_before_delete before delete on public.%I for each row execute function private.cms_before_delete()', t);
  end loop;
end $$;

-- versions: admin only (the public key sees nothing)
alter table public.content_versions enable row level security;
revoke all on public.content_versions from anon, authenticated;
grant select, delete on public.content_versions to authenticated;
drop policy if exists content_versions_admin_select on public.content_versions;
create policy content_versions_admin_select on public.content_versions for select to authenticated using ((select private.is_admin()));
drop policy if exists content_versions_admin_delete on public.content_versions;
create policy content_versions_admin_delete on public.content_versions for delete to authenticated using ((select private.is_admin()));

-- ============ media bucket "site-media": public read, admin-only write ============
-- (images jpg/png/webp <= 3 MB, video mp4 / audio mp3 <= 40 MB; magic-bytes + resize are done by the server in a later stage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 41943040,
        array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_admin_select on storage.objects;
create policy site_media_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));
drop policy if exists site_media_admin_insert on storage.objects;
create policy site_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (select private.is_admin()));
drop policy if exists site_media_admin_update on storage.objects;
create policy site_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()))
  with check (bucket_id = 'site-media' and (select private.is_admin()));
drop policy if exists site_media_admin_delete on storage.objects;
create policy site_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (select private.is_admin()));
