-- ======================================================================================
-- Purpose: support staged uploads for campus-college-load return attachments.
-- Scope: add update/delete RLS policies (needed for move/remove on staged
--   objects) and a cleanup function for abandoned staging/ uploads, reusing
--   the existing ftl-evaluation-return-attachment bucket with a staging/
--   prefix rather than a new bucket.
-- ======================================================================================

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_return_attachment_auth_update'
  ) then
    create policy ftl_return_attachment_auth_update
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'ftl-evaluation-return-attachment')
      with check (bucket_id = 'ftl-evaluation-return-attachment');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'ftl_return_attachment_auth_delete'
  ) then
    create policy ftl_return_attachment_auth_delete
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'ftl-evaluation-return-attachment');
  end if;
end
$$;

create or replace function public.storage_scope_from_path(p_name text)
returns text
language sql
immutable
as $$
  select split_part(coalesce(p_name, ''), '/', 1);
$$;

grant execute on function public.storage_scope_from_path(text) to authenticated;

-- Manually-invokable maintenance function (not scheduled — neither this
-- project nor the module it was ported from uses pg_cron). Deletes staged
-- return-attachment objects that were never committed.
create or replace function public.purge_stale_campus_college_load_staged_attachments(
  p_older_than interval default interval '24 hours'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted_count integer := 0;
begin
  with deleted as (
    delete from storage.objects so
    where so.bucket_id = 'ftl-evaluation-return-attachment'
      and public.storage_scope_from_path(so.name) = 'staging'
      and so.created_at < now() - p_older_than
    returning 1
  )
  select count(*) into v_deleted_count from deleted;

  return v_deleted_count;
end;
$$;
