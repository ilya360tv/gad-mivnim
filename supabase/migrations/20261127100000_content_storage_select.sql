-- Media library: editor/admin may LIST the files of the public bucket "site-ads" (public read by URL is unchanged).
drop policy if exists site_ads_staff_select on storage.objects;
create policy site_ads_staff_select on storage.objects for select to authenticated
  using (bucket_id = 'site-ads' and ((select private.is_editor()) or (select private.is_admin())));
