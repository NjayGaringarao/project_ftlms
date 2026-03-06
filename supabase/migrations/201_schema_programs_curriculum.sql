-- =========================================================
-- CORE SCHEMA (PART 2/5): PROGRAMS
-- Description:
--   Defines academic structures built on foundational entities.
--   Depends on: public.college.
-- =========================================================

create table if not exists public.program (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.college(id) on delete cascade,
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