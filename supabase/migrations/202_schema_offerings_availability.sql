-- =========================================================
-- CORE SCHEMA (PART 3/6): OFFERINGS AND AVAILABILITY
-- Description:
--   Defines campus offerings and term-aware sections.
--   Depends on: programs and key entities.
-- =========================================================

create table if not exists public.program_offering (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  campus_id uuid not null references public.campus(id) on delete cascade,
  program_id uuid not null references public.program(id) on delete cascade
);

create table if not exists public.major_offering (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  program_offering_id uuid not null references public.program_offering(id) on delete cascade,
  major_id uuid not null references public.major(id) on delete cascade
);

create table if not exists public.section (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  major_offering_id uuid not null references public.major_offering(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  year_level integer not null,
  name text not null,
  classification text not null default 'regular',
  student_count integer
);
