
-- =========================================================
-- CORE SCHEMA (PART 1/5): KEY ENTITIES
-- Description:
--   Defines foundational entities required by later schema files.
--   This file must run before programs, offerings,
--   user-domain, and faculty-operation schema migrations.
-- =========================================================

create table if not exists public.campus (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  address text
);

create table if not exists public.room (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campus(id) on delete cascade,
  code text not null,
  name text,
  capacity integer
);

create table if not exists public.college (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text
);

create table if not exists public.academic_rank (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text
);

create table if not exists public.course (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  lecture_unit numeric(4,2) not null default 0,
  laboratory_unit numeric(4,2) not null default 0
);

create table if not exists public.academic_year (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  start_year integer not null,
  end_year integer not null
);

create table if not exists public.academic_term (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  academic_year_id uuid not null references public.academic_year(id) on delete cascade,
  "name" public.academic_term_name not null,
  "start" date not null,
  "end" date not null
);
