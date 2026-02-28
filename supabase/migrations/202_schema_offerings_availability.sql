-- =========================================================
-- CORE SCHEMA (PART 3/5): OFFERINGS AND AVAILABILITY
-- Description:
--   Defines curriculum-term course offerings and campus availability.
--   Depends on: program/curriculum and key entities.
-- =========================================================

create table if not exists public.curriculum_at (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references public.curriculum(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade
);

create table if not exists public.course_c_t (
  id uuid primary key default gen_random_uuid(),
  curriculum_at_id uuid not null references public.curriculum_at(id) on delete cascade,
  course_id uuid not null references public.course(id) on delete cascade
);

create table if not exists public.program_campus (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campus(id) on delete cascade,
  program_id uuid not null references public.program(id) on delete cascade
);

create table if not exists public.major_p_c (
  id uuid primary key default gen_random_uuid(),
  program_campus_id uuid not null references public.program_campus(id) on delete cascade,
  major_id uuid not null references public.major(id) on delete cascade
);

create table if not exists public.block (
  id uuid primary key default gen_random_uuid(),
  major_p_c_id uuid not null references public.major_p_c(id) on delete cascade,
  curriculum_id uuid not null references public.curriculum(id) on delete restrict,
  year_level integer not null,
  section text not null,
  student_count integer
);