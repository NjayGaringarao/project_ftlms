-- =========================================================
-- CORE SCHEMA (PART 6/6): CAMPUS-COLLEGE LOAD WORKFLOW
-- Description:
--   Defines campus-college load revisions, evaluations, and export jobs.
--   Depends on: key entities, user-domain entities, and workflow enums.
-- =========================================================

create table if not exists public.campus_college_load (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campus(id) on delete cascade,
  college_id uuid not null references public.college(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  status public.campus_college_load_status_enum not null default 'DRAFT',
  current_step public.campus_college_load_step_enum not null default 'PROGRAM_CHAIR',
  created_by_user_id uuid references public."user"(id) on delete set null,
  created_by_designation_id uuid references public.designation(id) on delete set null,
  updated_by_user_id uuid references public."user"(id) on delete set null,
  updated_by_designation_id uuid references public.designation(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_college_load_revision (
  id uuid primary key default gen_random_uuid(),
  campus_college_load_id uuid not null references public.campus_college_load(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null default '{}'::jsonb,
  submitted_by_user_id uuid not null references public."user"(id) on delete restrict,
  submitted_by_designation_id uuid references public.designation(id) on delete set null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.campus_college_load_evaluation (
  id uuid primary key default gen_random_uuid(),
  campus_college_load_revision_id uuid not null references public.campus_college_load_revision(id) on delete cascade,
  step public.campus_college_load_evaluation_step_enum not null,
  designation_id uuid references public.designation(id) on delete set null,
  evaluator_user_id uuid references public."user"(id) on delete set null,
  status public.campus_college_load_evaluation_status_enum not null,
  comment text,
  attachment_bucket text,
  attachment_path text,
  attachment_file_name text,
  attachment_mime_type text,
  system_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- Multiple attachments per evaluation. The legacy singular attachment_* columns
-- on campus_college_load_evaluation remain for old rows; new evaluations leave
-- them null and use this table instead.
create table if not exists public.campus_college_load_evaluation_attachment (
  id uuid primary key default gen_random_uuid(),
  campus_college_load_evaluation_id uuid not null references public.campus_college_load_evaluation(id) on delete cascade,
  attachment_bucket text not null,
  attachment_path text not null,
  attachment_file_name text not null,
  attachment_mime_type text,
  created_at timestamptz not null default now()
);

create table if not exists public.document_export_job (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public."user"(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  document_type text not null default 'campus_college_load',
  scope_kind text not null,
  scope_payload jsonb not null default '{}'::jsonb,
  resolved_entity_ids jsonb not null default '[]'::jsonb,
  total_count integer not null default 0,
  processed_count integer not null default 0,
  status public.document_export_job_status_enum not null default 'QUEUED',
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
