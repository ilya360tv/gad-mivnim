-- Home ads screen, "split" design (TASK-ads-split.md): up to 3 optional bullet lines per ad.
-- Run in the Supabase SQL editor. Safe to re-run. Independent of 20261202090000_staff_permissions.sql.

begin;

alter table public.ads add column if not exists bullets text[] null;

-- null = no bullets; otherwise 1-3 lines, each 1-40 characters (not blank)
alter table public.ads drop constraint if exists ads_bullets_check;
alter table public.ads add constraint ads_bullets_check check (
  bullets is null or coalesce(
        array_ndims(bullets) = 1
    and array_lower(bullets, 1) = 1
    and cardinality(bullets) between 1 and 3
    and array_position(bullets, null) is null
    and char_length(bullets[1]) <= 40 and btrim(bullets[1]) <> ''
    and (cardinality(bullets) < 2 or (char_length(bullets[2]) <= 40 and btrim(bullets[2]) <> ''))
    and (cardinality(bullets) < 3 or (char_length(bullets[3]) <= 40 and btrim(bullets[3]) <> ''))
  , false)
);

-- demo ads only; an ad that already has bullets is not overwritten. All other ads stay without bullets.
update public.ads
   set bullets = array['מכרזים לפי תחום', 'אזור מנויים אישי', 'ליווי מלא מהחברה']
 where is_demo and title = 'הצטרפות לקבלני הבית' and bullets is null;

update public.ads
   set bullets = array['בנייה ועיצובים במקום אחד', 'חומרים ומוצרים מובחרים', 'ייעוץ אישי']
 where is_demo and title = 'אולם התצוגה – בקרוב' and bullets is null;

notify pgrst, 'reload schema';

commit;

-- result: exactly two rows should show bullets (the showroom ad and the contractors ad)
select sort_order, title, bullets from public.ads order by sort_order, created_at;
