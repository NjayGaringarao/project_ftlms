-- =========================================================
-- DOCUMENT EXPORT JOBS (GENERALIZED FROM FACULTY LOAD EXPORT)
-- =========================================================

do $$
begin
  if exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'faculty_load_export_job_status_enum'
  ) and not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'document_export_job_status_enum'
  ) then
    alter type public.faculty_load_export_job_status_enum
      rename to document_export_job_status_enum;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'faculty_load_export_job'
  ) and not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'document_export_job'
  ) then
    alter table public.faculty_load_export_job
      rename to document_export_job;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'document_export_job'
      and column_name = 'resolved_faculty_ids'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'document_export_job'
      and column_name = 'resolved_entity_ids'
  ) then
    alter table public.document_export_job
      rename column resolved_faculty_ids to resolved_entity_ids;
  end if;
end
$$;

alter table public.document_export_job
  add column if not exists document_type text not null default 'faculty_load',
  add column if not exists scope_payload jsonb not null default '{}'::jsonb,
  add column if not exists resolved_entity_ids jsonb not null default '[]'::jsonb;

update public.document_export_job
set
  document_type = coalesce(nullif(btrim(document_type), ''), 'faculty_load'),
  scope_payload = coalesce(scope_payload, '{}'::jsonb),
  resolved_entity_ids = coalesce(resolved_entity_ids, '[]'::jsonb)
where
  document_type is null
  or scope_payload is null
  or resolved_entity_ids is null;

alter table public.document_export_job
  alter column document_type set default 'faculty_load',
  alter column document_type set not null,
  alter column scope_payload set default '{}'::jsonb,
  alter column scope_payload set not null,
  alter column resolved_entity_ids set default '[]'::jsonb,
  alter column resolved_entity_ids set not null;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'faculty_load_export_job_json_shape_check'
  ) then
    alter table public.document_export_job
      drop constraint faculty_load_export_job_json_shape_check;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'document_export_job_json_shape_check'
  ) then
    alter table public.document_export_job
      add constraint document_export_job_json_shape_check
      check (
        jsonb_typeof(scope_payload) = 'object'
        and jsonb_typeof(resolved_entity_ids) = 'array'
      );
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'faculty_load_export_job_scope_kind_check'
  ) then
    alter table public.document_export_job
      rename constraint faculty_load_export_job_scope_kind_check to document_export_job_scope_kind_check;
  end if;

  if exists (
    select 1 from pg_constraint where conname = 'faculty_load_export_job_count_check'
  ) then
    alter table public.document_export_job
      rename constraint faculty_load_export_job_count_check to document_export_job_count_check;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from pg_class where relkind = 'i' and relname = 'idx_faculty_load_export_job_requester_created_at'
  ) then
    alter index public.idx_faculty_load_export_job_requester_created_at
      rename to idx_document_export_job_requester_created_at;
  end if;

  if exists (
    select 1 from pg_class where relkind = 'i' and relname = 'idx_faculty_load_export_job_status'
  ) then
    alter index public.idx_faculty_load_export_job_status
      rename to idx_document_export_job_status;
  end if;

  if exists (
    select 1 from pg_class where relkind = 'i' and relname = 'idx_faculty_load_export_job_academic_term'
  ) then
    alter index public.idx_faculty_load_export_job_academic_term
      rename to idx_document_export_job_academic_term;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.triggers
    where event_object_schema = 'public'
      and event_object_table = 'document_export_job'
      and trigger_name = 'trg_faculty_load_export_job_set_updated_at'
  ) then
    alter trigger trg_faculty_load_export_job_set_updated_at
      on public.document_export_job
      rename to trg_document_export_job_set_updated_at;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'faculty_load_export_job_select_own'
  ) then
    alter policy faculty_load_export_job_select_own
      on public.document_export_job
      rename to document_export_job_select_own;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'faculty_load_export_job_insert_own'
  ) then
    alter policy faculty_load_export_job_insert_own
      on public.document_export_job
      rename to document_export_job_insert_own;
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'document_export_job'
      and policyname = 'faculty_load_export_job_update_own'
  ) then
    alter policy faculty_load_export_job_update_own
      on public.document_export_job
      rename to document_export_job_update_own;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'claim_faculty_load_export_job'
      and pg_get_function_identity_arguments(oid) = 'p_job_id uuid, p_requester_user_id uuid, p_lock_seconds integer'
  ) and not exists (
    select 1
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'claim_document_export_job'
      and pg_get_function_identity_arguments(oid) = 'p_job_id uuid, p_requester_user_id uuid, p_lock_seconds integer'
  ) then
    alter function public.claim_faculty_load_export_job(uuid, uuid, integer)
      rename to claim_document_export_job;
  end if;
end
$$;

create or replace function public.claim_document_export_job(
  p_job_id uuid,
  p_requester_user_id uuid,
  p_lock_seconds integer default 120
)
returns public.document_export_job
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claimed public.document_export_job;
begin
  update public.document_export_job job
  set
    status = 'PROCESSING',
    started_at = coalesce(job.started_at, now()),
    lock_token = gen_random_uuid(),
    lock_expires_at = now() + make_interval(secs => greatest(coalesce(p_lock_seconds, 120), 30))
  where job.id = p_job_id
    and job.requester_user_id = p_requester_user_id
    and job.status in ('QUEUED', 'PROCESSING')
    and (job.lock_expires_at is null or job.lock_expires_at < now())
  returning job.* into v_claimed;

  return v_claimed;
end;
$$;

grant execute on function public.claim_document_export_job(uuid, uuid, integer) to authenticated;
