-- =========================================================
-- CORE SCHEMA (PART 4/5): USER DOMAIN
-- Description:
--   Defines user profile, identity, degree, and designation entities.
--   Depends on: key entities and offerings/availability entities.
-- =========================================================

create table if not exists public."user" (
  id uuid primary key references auth.users(id) on delete cascade,
  academic_rank_id uuid references public.academic_rank(id) on delete set null,
  employment_status public.employment_status_enum not null,
  campus_id uuid references public.campus(id) on delete set null,
  college_id uuid references public.college(id) on delete set null,
  employee_id text
);

create table if not exists public.identity (
  user_id uuid primary key references public."user"(id) on delete cascade,
  name text,
  birth_date date,
  address text,
  contact_number text
);

create table if not exists public.degree (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  academic_level public.academic_level_enum not null,
  title text not null,
  year_graduated integer,
  institution text,
  country_code char(2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.designation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."user"(id) on delete cascade,
  campus_id uuid references public.campus(id) on delete cascade,
  college_id uuid references public.college(id) on delete cascade,
  program_offering_id uuid references public.program_offering(id) on delete cascade,
  room_id uuid references public.room(id) on delete cascade,
  job_title public.designation_title_enum not null,
  load integer,
  designated_at timestamptz default now()
);
