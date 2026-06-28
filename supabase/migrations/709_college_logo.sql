alter table public.college
  add column if not exists logo_path text;

insert into storage.buckets (id, name, public)
values ('ftl-college-logos', 'ftl-college-logos', true)
on conflict (id) do update set public = excluded.public;

create policy ftl_college_logos_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ftl-college-logos');

create policy ftl_college_logos_update on storage.objects
  for update to authenticated
  using (bucket_id = 'ftl-college-logos')
  with check (bucket_id = 'ftl-college-logos');

create policy ftl_college_logos_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'ftl-college-logos');
