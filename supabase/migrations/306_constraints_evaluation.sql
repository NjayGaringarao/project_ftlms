do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_scope_unique'
      and conrelid = 'public.campus_college_load'::regclass
  ) then
    alter table public.campus_college_load
      add constraint campus_college_load_scope_unique
      unique (campus_id, college_id, academic_term_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_revision_number_unique'
      and conrelid = 'public.campus_college_load_revision'::regclass
  ) then
    alter table public.campus_college_load_revision
      add constraint campus_college_load_revision_number_unique
      unique (campus_college_load_id, revision_number);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_revision_snapshot_object_check'
      and conrelid = 'public.campus_college_load_revision'::regclass
  ) then
    alter table public.campus_college_load_revision
      add constraint campus_college_load_revision_snapshot_object_check
      check (jsonb_typeof(snapshot) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_evaluation_step_unique'
      and conrelid = 'public.campus_college_load_evaluation'::regclass
  ) then
    alter table public.campus_college_load_evaluation
      add constraint campus_college_load_evaluation_step_unique
      unique (campus_college_load_revision_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_return_comment_required'
      and conrelid = 'public.campus_college_load_evaluation'::regclass
  ) then
    alter table public.campus_college_load_evaluation
      add constraint campus_college_load_return_comment_required
      check (status <> 'RETURNED' or length(btrim(coalesce(comment, ''))) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_attachment_bucket_check'
      and conrelid = 'public.campus_college_load_evaluation'::regclass
  ) then
    alter table public.campus_college_load_evaluation
      add constraint campus_college_load_attachment_bucket_check
      check (
        attachment_path is null
        or attachment_bucket = 'ftl-evaluation-return-attachment'
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_evaluation_attachment_bucket_check'
      and conrelid = 'public.campus_college_load_evaluation_attachment'::regclass
  ) then
    alter table public.campus_college_load_evaluation_attachment
      add constraint campus_college_load_evaluation_attachment_bucket_check
      check (attachment_bucket = 'ftl-evaluation-return-attachment');
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
      check (document_type in ('campus_college_load'));
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

create index if not exists idx_campus_college_load_status_step
  on public.campus_college_load (status, current_step);

create index if not exists idx_campus_college_load_revision_load_submitted
  on public.campus_college_load_revision (campus_college_load_id, submitted_at desc);

create index if not exists idx_campus_college_load_evaluation_revision_created
  on public.campus_college_load_evaluation (campus_college_load_revision_id, created_at);

create index if not exists idx_campus_college_load_evaluation_attachment_evaluation
  on public.campus_college_load_evaluation_attachment (campus_college_load_evaluation_id);

create index if not exists idx_document_export_job_requester_created_at
  on public.document_export_job (requester_user_id, created_at desc);

create index if not exists idx_document_export_job_status
  on public.document_export_job (status);

create index if not exists idx_document_export_job_academic_term
  on public.document_export_job (academic_term_id);
