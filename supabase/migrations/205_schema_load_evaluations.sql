-- =========================================================
-- CORE SCHEMA (PART 6/6): LOAD PROPOSALS AND EVALUATIONS (ERD V7)
-- Description:
--   Defines faculty/campus load proposal snapshots and evaluation records.
--   Depends on: key entities, user-domain entities, and evaluation enums.
-- =========================================================

create table if not exists public.faculty_load_proposal (
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

create table if not exists public.campus_load (
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

create table if not exists public.campus_load_member (
  id uuid primary key default gen_random_uuid(),
  campus_load_id uuid not null references public.campus_load(id) on delete cascade,
  source_faculty_load_proposal_id uuid not null references public.faculty_load_proposal(id) on delete restrict,
  faculty_user_id uuid not null references public."user"(id) on delete restrict,
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
  source_faculty_load_proposal_lifecycle_status public.proposal_lifecycle_enum not null,
  source_faculty_load_proposal_created_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.faculty_load_evaluation (
  id uuid primary key default gen_random_uuid(),
  faculty_load_proposal_id uuid not null references public.faculty_load_proposal(id) on delete cascade,
  step public.faculty_load_step_enum not null default 'CAMPUS_DIRECTOR',
  designation_id uuid references public.designation(id) on delete set null,
  evaluator_user_id uuid references public."user"(id) on delete set null,
  status public.evaluation_status_enum not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.campus_load_evaluation (
  id uuid primary key default gen_random_uuid(),
  campus_load_id uuid not null references public.campus_load(id) on delete cascade,
  step public.campus_load_step_enum not null,
  designation_id uuid references public.designation(id) on delete set null,
  evaluator_user_id uuid references public."user"(id) on delete set null,
  status public.evaluation_status_enum not null,
  comment text,
  created_at timestamptz not null default now()
);
