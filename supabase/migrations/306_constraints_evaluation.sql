do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'faculty_load_proposal_current_user_term_unique'
  ) then
    create unique index faculty_load_proposal_current_user_term_unique
      on public.faculty_load_proposal (user_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'campus_load_current_campus_term_unique'
  ) then
    create unique index campus_load_current_campus_term_unique
      on public.campus_load (campus_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_member_source_unique'
      and conrelid = 'public.campus_load_member'::regclass
  ) then
    alter table public.campus_load_member
      add constraint campus_load_member_source_unique
      unique (campus_load_id, source_faculty_load_proposal_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'faculty_load_evaluation_step_unique'
      and conrelid = 'public.faculty_load_evaluation'::regclass
  ) then
    alter table public.faculty_load_evaluation
      add constraint faculty_load_evaluation_step_unique
      unique (faculty_load_proposal_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_evaluation_step_unique'
      and conrelid = 'public.campus_load_evaluation'::regclass
  ) then
    alter table public.campus_load_evaluation
      add constraint campus_load_evaluation_step_unique
      unique (campus_load_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'faculty_load_evaluation_status_final'
      and conrelid = 'public.faculty_load_evaluation'::regclass
  ) then
    alter table public.faculty_load_evaluation
      add constraint faculty_load_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_evaluation_status_final'
      and conrelid = 'public.campus_load_evaluation'::regclass
  ) then
    alter table public.campus_load_evaluation
      add constraint campus_load_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'faculty_load_proposal_snapshot_arrays_check'
      and conrelid = 'public.faculty_load_proposal'::regclass
  ) then
    alter table public.faculty_load_proposal
      add constraint faculty_load_proposal_snapshot_arrays_check
      check (
        jsonb_typeof(bachelors_degree) = 'array'
        and jsonb_typeof(masters_degree) = 'array'
        and jsonb_typeof(doctorate_degree) = 'array'
        and jsonb_typeof(designations) = 'array'
        and jsonb_typeof(schedule_sessions) = 'array'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_export_job_scope_kind_check'
      and conrelid = 'public.document_export_job'::regclass
  ) then
    alter table public.document_export_job
      add constraint document_export_job_scope_kind_check
      check (scope_kind in ('faculty_list', 'campus_insights'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_export_job_document_type_check'
      and conrelid = 'public.document_export_job'::regclass
  ) then
    alter table public.document_export_job
      add constraint document_export_job_document_type_check
      check (document_type in ('faculty_load'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_export_job_json_shape_check'
      and conrelid = 'public.document_export_job'::regclass
  ) then
    alter table public.document_export_job
      add constraint document_export_job_json_shape_check
      check (
        jsonb_typeof(scope_payload) = 'object'
        and jsonb_typeof(resolved_entity_ids) = 'array'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'document_export_job_count_check'
      and conrelid = 'public.document_export_job'::regclass
  ) then
    alter table public.document_export_job
      add constraint document_export_job_count_check
      check (
        total_count >= 0
        and processed_count >= 0
        and processed_count <= total_count
      );
  end if;
end;
$$;

create index if not exists idx_document_export_job_requester_created_at
  on public.document_export_job (requester_user_id, created_at desc);

create index if not exists idx_document_export_job_status
  on public.document_export_job (status);

create index if not exists idx_document_export_job_academic_term
  on public.document_export_job (academic_term_id);
