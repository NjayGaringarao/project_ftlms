-- =========================================================
-- CORE SCHEMA (PART 5/5): FACULTY OPERATIONS (ERD V7)
-- Description:
--   Defines classes, utilization, sessions, and evaluation workflow.
--   Depends on: offerings/availability and user-domain entities.
-- =========================================================

create table if not exists public.class (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_utilization (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.class(id) on delete set null,
  course_id uuid not null references public.course(id) on delete restrict,
  block_id uuid not null references public.block(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.user_class (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  class_id uuid not null references public.class(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.session (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  room_id uuid references public.room(id) on delete set null,
  day public.day_of_week_enum not null,
  start_time time not null,
  end_time time not null,
  type public.session_type_enum not null
);

create table if not exists public.session_class (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class(id) on delete cascade,
  session_id uuid not null references public.session(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.proposal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  campus_id uuid not null references public.campus(id) on delete restrict,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  employment_status public.employment_status_enum not null,
  academic_rank text,
  bachelors_degree text,
  masters_degree text,
  doctorate_degree text,
  designations text,
  equivalent_teaching_load numeric,
  total_lecture_hours numeric,
  total_lab_hours numeric,
  preparation_count integer,
  actual_teaching_load numeric,
  advisory_class text,
  lifecycle_status public.proposal_lifecycle_enum not null default 'ACTIVE',
  invalidated_reason text,
  created_by_user_id uuid references public."user"(id) on delete set null,
  created_by_designation_id uuid references public.designation(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_proposal (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campus(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  lifecycle_status public.proposal_lifecycle_enum not null default 'ACTIVE',
  invalidated_reason text,
  created_by_user_id uuid not null references public."user"(id) on delete restrict,
  created_by_designation_id uuid references public.designation(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_proposal_member (
  id uuid primary key default gen_random_uuid(),
  campus_proposal_id uuid not null references public.campus_proposal(id) on delete cascade,
  source_proposal_id uuid not null references public.proposal(id) on delete restrict,
  proposal_user_id uuid not null references public."user"(id) on delete restrict,
  employment_status public.employment_status_enum not null,
  academic_rank text,
  bachelors_degree text,
  masters_degree text,
  doctorate_degree text,
  designations text,
  equivalent_teaching_load numeric,
  total_lecture_hours numeric,
  total_lab_hours numeric,
  preparation_count integer,
  actual_teaching_load numeric,
  advisory_class text,
  source_proposal_lifecycle_status public.proposal_lifecycle_enum not null,
  source_proposal_created_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.individual_proposal_evaluation (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposal(id) on delete cascade,
  step public.individual_proposal_step_enum not null default 'CAMPUS_DIRECTOR',
  designation_id uuid references public.designation(id) on delete set null,
  evaluator_user_id uuid references public."user"(id) on delete set null,
  status public.evaluation_status_enum not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_proposal_evaluation (
  id uuid primary key default gen_random_uuid(),
  campus_proposal_id uuid not null references public.campus_proposal(id) on delete cascade,
  step public.campus_proposal_step_enum not null,
  designation_id uuid references public.designation(id) on delete set null,
  evaluator_user_id uuid references public."user"(id) on delete set null,
  status public.evaluation_status_enum not null,
  comment text,
  created_at timestamptz not null default now()
);
