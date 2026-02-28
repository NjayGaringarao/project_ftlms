-- =========================================================
-- CORE SCHEMA (PART 2/5): PROGRAMS AND CURRICULUM
-- Description:
--   Defines academic structures built on foundational entities.
--   Depends on: public.department, public.academic_term, public.course.
-- =========================================================

create table if not exists public.program (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.department(id) on delete cascade,
  code text not null,
  name text not null,
  description text
);

create table if not exists public.major (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.program(id) on delete cascade,
  code text not null,
  name text not null,
  description text
);

create table if not exists public.curriculum (
  id uuid primary key default gen_random_uuid(),
  major_id uuid not null references public.major(id) on delete cascade,
  title text not null,
  series_year integer not null,
  revised_year integer
);