-- =========================================================
-- FACULTY LOAD EXPORT JOBS (ASYNC BULK PDF EXPORT)
-- =========================================================

do $$
begin
  if not exists (
    select 1 from pg_type where typname = 'faculty_load_export_job_status_enum'
  ) then
    create type public.faculty_load_export_job_status_enum as enum (
      'QUEUED',
      'PROCESSING',
      'COMPLETED',
      'FAILED'
    );
  end if;
end
$$;

create table if not exists public.faculty_load_export_job (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public."user"(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  scope_kind text not null,
  scope_payload jsonb not null default '{}'::jsonb,
  resolved_faculty_ids jsonb not null default '[]'::jsonb,
  total_count integer not null default 0,
  processed_count integer not null default 0,
  status public.faculty_load_export_job_status_enum not null default 'QUEUED',
  output_bucket text,
  output_path text,
  output_file_name text,
  output_mime_type text,
  error_message text,
  expires_at timestamptz,
  lock_token uuid,
  lock_expires_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.faculty_load_export_job
  add column if not exists scope_payload jsonb not null default '{}'::jsonb,
  add column if not exists resolved_faculty_ids jsonb not null default '[]'::jsonb,
  add column if not exists total_count integer not null default 0,
  add column if not exists processed_count integer not null default 0,
  add column if not exists output_bucket text,
  add column if not exists output_path text,
  add column if not exists output_file_name text,
  add column if not exists output_mime_type text,
  add column if not exists error_message text,
  add column if not exists expires_at timestamptz,
  add column if not exists lock_token uuid,
  add column if not exists lock_expires_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.faculty_load_export_job
set
  scope_payload = coalesce(scope_payload, '{}'::jsonb),
  resolved_faculty_ids = coalesce(resolved_faculty_ids, '[]'::jsonb),
  total_count = greatest(coalesce(total_count, 0), 0),
  processed_count = greatest(coalesce(processed_count, 0), 0)
where
  scope_payload is null
  or resolved_faculty_ids is null
  or total_count is null
  or processed_count is null;

alter table public.faculty_load_export_job
  alter column scope_payload set default '{}'::jsonb,
  alter column resolved_faculty_ids set default '[]'::jsonb,
  alter column total_count set default 0,
  alter column processed_count set default 0,
  alter column status set default 'QUEUED',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.faculty_load_export_job
  alter column scope_payload set not null,
  alter column resolved_faculty_ids set not null,
  alter column total_count set not null,
  alter column processed_count set not null,
  alter column status set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'faculty_load_export_job_scope_kind_check'
  ) then
    alter table public.faculty_load_export_job
      add constraint faculty_load_export_job_scope_kind_check
      check (scope_kind in ('faculty_list', 'campus_insights'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'faculty_load_export_job_json_shape_check'
  ) then
    alter table public.faculty_load_export_job
      add constraint faculty_load_export_job_json_shape_check
      check (
        jsonb_typeof(scope_payload) = 'object'
        and jsonb_typeof(resolved_faculty_ids) = 'array'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'faculty_load_export_job_count_check'
  ) then
    alter table public.faculty_load_export_job
      add constraint faculty_load_export_job_count_check
      check (
        total_count >= 0
        and processed_count >= 0
        and processed_count <= total_count
      );
  end if;
end
$$;

create index if not exists idx_faculty_load_export_job_requester_created_at
  on public.faculty_load_export_job (requester_user_id, created_at desc);

create index if not exists idx_faculty_load_export_job_status
  on public.faculty_load_export_job (status);

create index if not exists idx_faculty_load_export_job_academic_term
  on public.faculty_load_export_job (academic_term_id);

drop trigger if exists trg_faculty_load_export_job_set_updated_at
  on public.faculty_load_export_job;

create trigger trg_faculty_load_export_job_set_updated_at
before update on public.faculty_load_export_job
for each row
execute function public.set_updated_at();

alter table public.faculty_load_export_job enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'faculty_load_export_job'
      and policyname = 'faculty_load_export_job_select_own'
  ) then
    create policy faculty_load_export_job_select_own
      on public.faculty_load_export_job
      for select
      to authenticated
      using (requester_user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'faculty_load_export_job'
      and policyname = 'faculty_load_export_job_insert_own'
  ) then
    create policy faculty_load_export_job_insert_own
      on public.faculty_load_export_job
      for insert
      to authenticated
      with check (requester_user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'faculty_load_export_job'
      and policyname = 'faculty_load_export_job_update_own'
  ) then
    create policy faculty_load_export_job_update_own
      on public.faculty_load_export_job
      for update
      to authenticated
      using (requester_user_id = auth.uid())
      with check (requester_user_id = auth.uid());
  end if;
end
$$;

create or replace function public.claim_faculty_load_export_job(
  p_job_id uuid,
  p_requester_user_id uuid,
  p_lock_seconds integer default 120
)
returns public.faculty_load_export_job
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claimed public.faculty_load_export_job;
begin
  update public.faculty_load_export_job job
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

grant execute on function public.claim_faculty_load_export_job(uuid, uuid, integer) to authenticated;

insert into storage.buckets (id, name, public)
values ('ftl-exports', 'ftl-exports', false)
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
end
$$;
