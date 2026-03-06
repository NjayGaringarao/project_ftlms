-- =========================================================
-- CORE SCHEMA (PART 6/6): SIMPLIFIED SCHEDULING V6
-- Description:
--   Introduces class/class_block and term-based block context for ERD v6.
--   Keeps legacy curriculum/offering/class_delivery chain intact for now.
-- =========================================================

create table if not exists public.class (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedule(id) on delete cascade,
  course_id uuid not null references public.course(id) on delete restrict,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_block (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class(id) on delete cascade,
  block_id uuid not null references public.block(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.block
  add column if not exists academic_term_id uuid references public.academic_term(id) on delete cascade;

alter table public.block
  add column if not exists code text;

alter table public.session
  add column if not exists class_id uuid references public.class(id) on delete cascade;
