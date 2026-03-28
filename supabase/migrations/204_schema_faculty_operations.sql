-- =========================================================
-- CORE SCHEMA (PART 5/6): FACULTY OPERATIONS (ERD V7)
-- Description:
--   Defines classes, utilization, and session linkage.
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

