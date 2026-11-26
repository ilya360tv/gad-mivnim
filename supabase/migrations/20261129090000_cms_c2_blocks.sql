-- CMS stage C2: page texts and images ("page_blocks"). Same rules as C1: public reads only published, not-deleted rows;
-- only private.is_admin() writes; every save keeps the previous version; delete = recycle bin (deleted_at).
-- key = the EXISTING i18n key (js/i18n.js) for texts, or "img.<page>.<name>" for images (data-cms-img in the HTML).
-- The database value OVERRIDES the built-in one only for rows that were edited in the studio (updated_by is set);
-- empty en/ru/fr fields keep the built-in translation; if everything is empty/unreachable the site shows what it shows today.

create table if not exists public.page_blocks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (char_length(key) between 1 and 120),
  page text not null check (char_length(page) between 1 and 60),
  type text not null check (type in ('text','rich','image','video')),
  value_he text,
  value_en text,
  value_ru text,
  value_fr text,
  image_path text check (image_path is null or image_path ~ '^(images/[A-Za-z0-9_./-]+|video/[A-Za-z0-9_./-]+|https://[a-z0-9.-]+\.supabase\.co/storage/v1/object/public/site-media/[A-Za-z0-9_./-]+)$'),
  image_alt text,
  status text not null default 'draft' check (status in ('draft','published')),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint page_blocks_image_alt check (type not in ('image','video') or image_path is null or char_length(coalesce(image_alt, '')) > 0)
);
create index if not exists page_blocks_page_idx on public.page_blocks (page, sort_order);
create index if not exists page_blocks_updated_by_idx on public.page_blocks (updated_by);

-- ============ server-side sanitizing (no scripts / HTML injection) ============
-- text  : every tag removed.
-- rich  : only <b> <strong> <i> <em> <br> <ul> <ol> <li> <p> <bdi> <span> and <a href="https://..|/..|mailto:..|tel:..">; all attributes dropped
--         (except the safe href, rel="noopener" added); script/style/iframe/object/embed removed together with their content.
create or replace function private.cms_clean_text(v text)
returns text language sql immutable set search_path = '' as $$
  select nullif(btrim(regexp_replace(coalesce(v, ''), '<[^>]*>', '', 'g')), '')
$$;

create or replace function private.cms_clean_rich(v text)
returns text language plpgsql immutable set search_path = '' as $$
declare s text := coalesce(v, '');
begin
  s := regexp_replace(s, '<(script|style|iframe|object|embed)\b[^>]*>.*?</\1\s*>', '', 'gi');
  s := regexp_replace(s, '<(script|style|iframe|object|embed)\b[^>]*>', '', 'gi');
  -- safe anchors first (rewritten into one fixed form)
  s := regexp_replace(s, '<a\s+[^>]*?href\s*=\s*"((?:https://|/(?!/)|mailto:|tel:)[^"<>]*)"[^>]*>', '<a href="\1" rel="noopener">', 'gi');
  -- every other tag (and every <a> not in the fixed form) is removed
  s := regexp_replace(s, '<a(?! href="[^"<>]*" rel="noopener">)(\s[^>]*)?>', '', 'gi');
  s := regexp_replace(s, '<(?!/?(?:b|strong|i|em|br|ul|ol|li|p|bdi|span|a)\M)[^>]*>', '', 'gi');
  -- attributes of the allowed tags (except the fixed anchor) are dropped
  -- class="..." (letters, digits, - _ and spaces only) is kept on the allowed tags so the site's styling survives; every other attribute is dropped
  s := regexp_replace(s, '<(b|strong|i|em|ul|ol|li|p|bdi|span)\s+[^>]*?class\s*=\s*"([A-Za-z0-9_ -]*)"[^>]*>', '<\1 class="\2">', 'gi');
  s := regexp_replace(s, '<(b|strong|i|em|ul|ol|li|p|bdi|span)(?! class="[A-Za-z0-9_ -]*">)\s[^>]*>', '<\1>', 'gi');
  s := regexp_replace(s, '<br\s[^>]*>', '<br>', 'gi');
  s := regexp_replace(s, '</(b|strong|i|em|ul|ol|li|p|bdi|span|a)\s[^>]*>', '</\1>', 'gi');
  return nullif(btrim(s), '');
end $$;

create or replace function private.cms_blocks_sanitize()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.type = 'rich' then
    new.value_he := private.cms_clean_rich(new.value_he);
    new.value_en := private.cms_clean_rich(new.value_en);
    new.value_ru := private.cms_clean_rich(new.value_ru);
    new.value_fr := private.cms_clean_rich(new.value_fr);
  else
    new.value_he := private.cms_clean_text(new.value_he);
    new.value_en := private.cms_clean_text(new.value_en);
    new.value_ru := private.cms_clean_text(new.value_ru);
    new.value_fr := private.cms_clean_text(new.value_fr);
  end if;
  new.image_alt := private.cms_clean_text(new.image_alt);
  return new;
end $$;

drop trigger if exists cms_blocks_sanitize on public.page_blocks;
create trigger cms_blocks_sanitize before insert or update on public.page_blocks
  for each row execute function private.cms_blocks_sanitize();

revoke all on function private.cms_clean_text(text), private.cms_clean_rich(text), private.cms_blocks_sanitize() from public, anon, authenticated;

-- ============ RLS / grants / version + recycle-bin triggers (same as the C1 tables) ============
alter table public.page_blocks enable row level security;
alter table public.page_blocks force row level security;
revoke all on public.page_blocks from anon, authenticated;
grant select on public.page_blocks to anon, authenticated;
grant insert, update, delete on public.page_blocks to authenticated;

drop policy if exists page_blocks_public_select on public.page_blocks;
create policy page_blocks_public_select on public.page_blocks for select to anon, authenticated
  using (status = 'published' and deleted_at is null);
drop policy if exists page_blocks_admin_all on public.page_blocks;
create policy page_blocks_admin_all on public.page_blocks for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop trigger if exists cms_before_update on public.page_blocks;
create trigger cms_before_update before update on public.page_blocks for each row execute function private.cms_before_update();
drop trigger if exists cms_before_delete on public.page_blocks;
create trigger cms_before_delete before delete on public.page_blocks for each row execute function private.cms_before_delete();

-- the recycle-bin purge now covers the blocks too
create or replace function private.cms_purge_bin()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer := 0; c integer; t text;
begin
  if (select auth.uid()) is not null and not private.is_admin() then
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

-- ============ the single public request now also carries the EDITED page blocks (small) ============
create or replace function public.cms_public()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'podcast_episodes', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.podcast_episodes t), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.projects t), '[]'::jsonb),
    'in_progress', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.in_progress t), '[]'::jsonb),
    'partners', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.partners t), '[]'::jsonb),
    'info_articles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.info_articles t), '[]'::jsonb),
    'job_roles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.job_roles t), '[]'::jsonb),
    'gallery_items', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.gallery_items t), '[]'::jsonb),
    'page_blocks', coalesce((select jsonb_agg(jsonb_build_object('key', t.key, 'type', t.type, 'value_he', t.value_he, 'value_en', t.value_en, 'value_ru', t.value_ru,
        'value_fr', t.value_fr, 'image_path', t.image_path, 'image_alt', t.image_alt) order by t.sort_order) from public.page_blocks t where t.updated_by is not null), '[]'::jsonb)
  );
$$;
revoke all on function public.cms_public() from public;
grant execute on function public.cms_public() to anon, authenticated;
