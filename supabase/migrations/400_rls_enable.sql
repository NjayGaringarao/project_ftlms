alter table public.document_export_job enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'document_export_job_select_own'
  ) then
    create policy document_export_job_select_own
      on public.document_export_job
      for select
      to authenticated
      using (requester_user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'document_export_job_insert_own'
  ) then
    create policy document_export_job_insert_own
      on public.document_export_job
      for insert
      to authenticated
      with check (requester_user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'document_export_job_update_own'
  ) then
    create policy document_export_job_update_own
      on public.document_export_job
      for update
      to authenticated
      using (requester_user_id = auth.uid())
      with check (requester_user_id = auth.uid());
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('ftl-exports', 'ftl-exports', false)
on conflict (id) do update
set public = excluded.public;

insert into storage.buckets (id, name, public)
values (
  'ftl-evaluation-return-attachment',
  'ftl-evaluation-return-attachment',
  false
)
on conflict (id) do update
set public = excluded.public;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_exports_auth_select'
  ) then
    create policy ftl_exports_auth_select
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'ftl-exports');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_exports_auth_insert'
  ) then
    create policy ftl_exports_auth_insert
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'ftl-exports');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_exports_auth_update'
  ) then
    create policy ftl_exports_auth_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'ftl-exports')
      with check (bucket_id = 'ftl-exports');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_exports_auth_delete'
  ) then
    create policy ftl_exports_auth_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'ftl-exports');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_return_attachment_auth_select'
  ) then
    create policy ftl_return_attachment_auth_select
      on storage.objects
      for select
      to authenticated
      using (bucket_id = 'ftl-evaluation-return-attachment');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_return_attachment_auth_insert'
  ) then
    create policy ftl_return_attachment_auth_insert
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'ftl-evaluation-return-attachment');
  end if;
end
$$;
