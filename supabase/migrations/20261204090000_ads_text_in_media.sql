-- Home ads screen: mark ads whose picture/video already contains its own title,
-- so the side panel does not repeat it. Run in the Supabase SQL editor. Safe to re-run.
-- Independent of 20261202090000_staff_permissions.sql.

begin;

alter table public.ads add column if not exists text_in_media boolean not null default false;

-- all current demo ads have their title inside the media
update public.ads set text_in_media = true where is_demo and not text_in_media;

notify pgrst, 'reload schema';

commit;

-- result: every demo ad should show text_in_media = true
select sort_order, title, is_demo, text_in_media from public.ads order by sort_order, created_at;
