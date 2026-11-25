-- Home-page ads window: table public.ads + public bucket "site-ads".
-- Own ads + partners' ads only. No statistics / weights in v1.

create table if not exists public.ads (
  id           uuid primary key default gen_random_uuid(),
  title        text not null check (char_length(title) between 1 and 80),
  advertiser   text not null check (char_length(advertiser) between 1 and 80),
  media_path   text not null,
  media_type   text not null check (media_type in ('image','video')),
  poster_path  text null,
  alt_text     text not null check (char_length(alt_text) between 1 and 150),
  link_url     text null check (link_url is null or link_url ~ '^(https://|/)'),
  cta_text     text null check (cta_text is null or char_length(cta_text) <= 40),
  starts_at    date null,
  ends_at      date null,
  active       boolean not null default false,
  sort_order   integer not null default 0,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint ads_dates_ok check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create or replace function private.ads_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists ads_touch_updated_at on public.ads;
create trigger ads_touch_updated_at before update on public.ads
  for each row execute function private.ads_touch_updated_at();

create index if not exists ads_sort_idx on public.ads (sort_order, created_at);

alter table public.ads enable row level security;
alter table public.ads force row level security;

revoke all on public.ads from anon, authenticated;
grant select on public.ads to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;

drop policy if exists ads_public_select on public.ads;
create policy ads_public_select on public.ads for select to anon, authenticated
  using (
    active
    and (starts_at is null or starts_at <= current_date)
    and (ends_at   is null or ends_at   >= current_date)
  );

drop policy if exists ads_admin_all on public.ads;
create policy ads_admin_all on public.ads for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============ STORAGE: public-read bucket, admin-only writes ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-ads', 'site-ads', true, 15728640,
        array['image/jpeg','image/png','image/webp','video/mp4'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- (images <= 2 MB / video <= 15 MB: the bucket cap is 15 MB; the admin upload function enforces 2 MB for images)

drop policy if exists site_ads_admin_insert on storage.objects;
create policy site_ads_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-ads' and (select private.is_admin()));
drop policy if exists site_ads_admin_update on storage.objects;
create policy site_ads_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'site-ads' and (select private.is_admin()))
  with check (bucket_id = 'site-ads' and (select private.is_admin()));
drop policy if exists site_ads_admin_delete on storage.objects;
create policy site_ads_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-ads' and (select private.is_admin()));
