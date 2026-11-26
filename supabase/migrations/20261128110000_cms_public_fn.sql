-- CMS C1: ONE public request for all published list content (RLS still applies: the caller sees only status=published, not deleted).
-- "edited" = true when the row was changed in the studio (so the site knows whether to use the database or the built-in content).

create or replace function public.cms_public()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'podcast_episodes', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.podcast_episodes t), '[]'::jsonb),
    'projects', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.projects t), '[]'::jsonb),
    'in_progress', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.in_progress t), '[]'::jsonb),
    'partners', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.partners t), '[]'::jsonb),
    'info_articles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.info_articles t), '[]'::jsonb),
    'job_roles', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.job_roles t), '[]'::jsonb),
    'gallery_items', coalesce((select jsonb_agg(to_jsonb(t) - 'updated_by' || jsonb_build_object('edited', t.updated_by is not null) order by t.sort_order, t.created_at) from public.gallery_items t), '[]'::jsonb)
  );
$$;

revoke all on function public.cms_public() from public;
grant execute on function public.cms_public() to anon, authenticated;

-- Fix for the first import: these 4 projects have NO logo file ("logo": "" in js/projects-data.js), but the import stored the slug as the logo name.
update public.projects set logo = '' where slug in ('migdal-ir-yerushalayim','tzur-hadassah-house','malha-house','gan-beitar-illit') and logo = slug;
