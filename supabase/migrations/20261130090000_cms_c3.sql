-- CMS C3: draft preview + recycle-bin purge wrapper (admin only).
-- cms_preview(): like cms_public() but for the logged-in ADMIN: includes DRAFT rows (not deleted) and marks everything as edited,
-- so the real site pages can be opened with ?cmsPreview=1 and show the draft content. Everyone else gets 42501.

create or replace function public.cms_preview()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.is_admin() then
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

-- permanent removal of items that stayed 30 days in the recycle bin (the studio calls this when it opens the bin)
create or replace function public.cms_purge_bin()
returns integer language sql security invoker set search_path = '' as $$ select private.cms_purge_bin() $$;
revoke all on function public.cms_purge_bin() from public, anon;
grant execute on function public.cms_purge_bin() to authenticated;
