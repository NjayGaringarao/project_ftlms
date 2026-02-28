-- =========================================================
-- CORE SCHEMA (PART 5/5): FACULTY OPERATIONS
-- Description:
--   Defines scheduling, class delivery, sessions, and evaluation.
--   Depends on: offerings/availability and user-domain entities.
-- =========================================================

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  academic_term_id uuid not null references public.academic_term(id) on delete cascade,
  updated_at timestamptz default now()
);

create table if not exists public.class (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedule(id) on delete cascade,
  course_c_t_id uuid not null references public.course_c_t(id) on delete cascade,
  block_id uuid references public.block(id) on delete set null
);

create table if not exists public.session (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.class(id) on delete cascade,
  room_id uuid references public.room(id) on delete set null,
  day integer not null,
  start_time time not null,
  end_time time not null
);

create table if not exists public.evaluation (
  id uuid primary key default gen_random_uuid(),
  designation_id uuid not null references public.designation(id) on delete cascade,
  schedule_id uuid not null references public.schedule(id) on delete cascade,
  evaluation_level integer,
  evaluator_role text,
  status public.evaluation_status_enum not null default 'PENDING',
  comment text,
  created_at timestamptz default now()
);