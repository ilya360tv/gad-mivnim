-- In-video ads ("cue points"): an ad inserted into a VIDEO ad at a given second.
-- mode 'overlay' = a card over the playing video; 'midroll' = the host pauses and the inserted ad plays full size.

create table if not exists public.ad_cues (
  id                 uuid primary key default gen_random_uuid(),
  host_ad_id         uuid not null references public.ads(id) on delete cascade,
  at_second          numeric not null check (at_second >= 0),
  insert_ad_id       uuid not null references public.ads(id) on delete cascade,
  mode               text not null check (mode in ('overlay','midroll')),
  duration_s         integer not null default 6 check (duration_s between 3 and 30),   -- for images / overlay
  skippable_after_s  integer not null default 5 check (skippable_after_s between 0 and 30),
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint ad_cues_not_self check (host_ad_id <> insert_ad_id)
);

create index if not exists ad_cues_host_idx on public.ad_cues (host_ad_id, at_second);

-- The host must be a video ad (a CHECK cannot look at another table, so a trigger does it)
create or replace function private.ad_cues_validate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.ads a where a.id = new.host_ad_id and a.media_type = 'video') then
    raise exception 'host ad must be a video ad';
  end if;
  return new;
end $$;
revoke all on function private.ad_cues_validate() from public, anon, authenticated;

drop trigger if exists ad_cues_validate on public.ad_cues;
create trigger ad_cues_validate before insert or update of host_ad_id on public.ad_cues
  for each row execute function private.ad_cues_validate();

alter table public.ad_cues enable row level security;
alter table public.ad_cues force row level security;

revoke all on public.ad_cues from anon, authenticated;
grant select on public.ad_cues to anon, authenticated;
grant insert, update, delete on public.ad_cues to authenticated;

-- Public: only active cues whose host AND inserted ads are currently visible (active + inside their dates)
drop policy if exists ad_cues_public_select on public.ad_cues;
create policy ad_cues_public_select on public.ad_cues for select to anon, authenticated
  using (
    active
    and exists (select 1 from public.ads h where h.id = host_ad_id and h.active
                and (h.starts_at is null or h.starts_at <= current_date) and (h.ends_at is null or h.ends_at >= current_date))
    and exists (select 1 from public.ads i where i.id = insert_ad_id and i.active
                and (i.starts_at is null or i.starts_at <= current_date) and (i.ends_at is null or i.ends_at >= current_date))
  );

drop policy if exists ad_cues_admin_all on public.ad_cues;
create policy ad_cues_admin_all on public.ad_cues for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
