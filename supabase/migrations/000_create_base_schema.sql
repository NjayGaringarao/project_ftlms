-- =========================================================
-- RESET (DEV ONLY)
-- =========================================================

do $$
declare r record;
begin
  for r in (
    select tablename
    from pg_tables
    where schemaname = 'public'
  )
  loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;
end $$;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- =========================================================
-- ENUMS
-- =========================================================

drop type if exists employment_status_enum cascade;
create type employment_status_enum as enum ('FULL_TIME','PART_TIME');

drop type if exists evaluation_status_enum cascade;
create type evaluation_status_enum as enum ('PENDING','APPROVED','REJECTED');

drop type if exists department_type_enum cascade;
create type department_type_enum as enum (
  'ACADEMIC',
  'ADMINISTRATIVE',
  'STUDENT_SERVICES',
  'EXTENSION_SERVICES'
);

drop type if exists academic_terms_type_enum cascade;
create type academic_terms_type_enum as enum ('SEMESTER','TRIMESTER','QUARTER');

drop type if exists academic_terms_term_order cascade;
create type academic_terms_term_order as enum ('FIRST','SECOND','THIRD','FOURTH');

-- =========================================================
-- CORE STRUCTURE
-- =========================================================

create table campus (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  address text,
  zip_code text
);

create table department (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type department_type_enum not null,
  description text
);

create table program (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references department(id) on delete cascade,
  code text unique not null,
  name text not null,
  description text
);

create table major (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references program(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  unique(program_id, code)
);

create table course (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  lecture_hour numeric(4,2) default 0 check (lecture_hour >= 0),
  laboratory_hour numeric(4,2) default 0 check (laboratory_hour >= 0)
);

-- =========================================================
-- CURRICULUM
-- =========================================================

create table curriculum (
  id uuid primary key default gen_random_uuid(),
  major_id uuid not null references major(id) on delete cascade,
  title text not null,
  series_year integer not null,
  revised_year integer check (revised_year is null or series_year < revised_year)
);

create unique index curriculum_major_series_revised_unique_idx
on curriculum (
  major_id,
  series_year,
  coalesce(revised_year, -1)
);

create table academic_term (
  id uuid primary key default gen_random_uuid(),
  academic_year_start integer not null check (academic_year_start >= 2000),
  academic_year_end integer not null check (academic_year_end >= academic_year_start),
  code text not null,
  term_order academic_terms_term_order not null,
  type academic_terms_type_enum not null,
  start date not null,
  "end" date not null,

  check ("end" >= start),

  unique(academic_year_start, academic_year_end, type, term_order, code),

  check (
    (type='SEMESTER' AND term_order in ('FIRST','SECOND')) OR
    (type='TRIMESTER' AND term_order in ('FIRST','SECOND','THIRD')) OR
    (type='QUARTER' AND term_order in ('FIRST','SECOND','THIRD','FOURTH'))
  ),

  constraint academic_year_no_overlap
  exclude using gist (
    academic_year_start with =,
    academic_year_end with =,
    type with =,
    term_order with =,
    daterange(start,"end",'[)') with &&
  )
);

create table curriculum_at (
  id uuid primary key default gen_random_uuid(),
  curriculum_id uuid not null references curriculum(id) on delete cascade,
  academic_term_id uuid not null references academic_term(id) on delete cascade,
  unique(curriculum_id, academic_term_id)
);

create table course_c_t (
  id uuid primary key default gen_random_uuid(),
  curriculum_at_id uuid not null references curriculum_at(id) on delete cascade,
  course_id uuid not null references course(id) on delete cascade,
  unique(curriculum_at_id, course_id)
);

-- =========================================================
-- OFFERING STRUCTURE
-- =========================================================

create table program_campus (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references campus(id) on delete cascade,
  program_id uuid not null references program(id) on delete cascade,
  unique(campus_id, program_id)
);

create table major_p_c (
  id uuid primary key default gen_random_uuid(),
  program_campus_id uuid not null references program_campus(id) on delete cascade,
  major_id uuid not null references major(id) on delete cascade,
  unique(program_campus_id, major_id)
);

create table block (
  id uuid primary key default gen_random_uuid(),
  major_p_c_id uuid not null references major_p_c(id) on delete cascade,
  curriculum_id uuid not null references curriculum(id) on delete restrict,
  year_level integer not null,
  section text not null,
  student_count integer check (student_count >= 0),
  unique(major_p_c_id, curriculum_id, year_level, section)
);

-- =========================================================
-- USER DOMAIN
-- =========================================================

create table academic_rank (
  id uuid primary key default gen_random_uuid(),
  number integer unique not null,
  title text unique not null,
  description text
);

create table "user" (
  id uuid primary key references auth.users(id) on delete cascade,
  academic_rank_id uuid references academic_rank(id) on delete set null,
  employment_status employment_status_enum not null
);

create table identity (
  user_id uuid primary key references "user"(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  extension text,
  birth_date date,
  address text,
  zip_code text,
  contact_number text
);

create table degree (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  academic_level text,
  degree_type text,
  field_of_study text,
  year_graduated integer,
  institution text,
  country_code char(2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================================================
-- FACULTY OPERATIONS
-- =========================================================

create table schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  academic_term_id uuid not null references academic_term(id) on delete cascade,
  updated_at timestamptz default now(),
  unique(user_id, academic_term_id)
);

create table class (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedule(id) on delete cascade,
  course_c_t_id uuid not null references course_c_t(id) on delete cascade,
  block_id uuid references block(id) on delete set null
);

create table room (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references campus(id) on delete cascade,
  code text not null,
  name text,
  capacity integer check (capacity >= 0),
  unique(campus_id, code)
);

create table session (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references class(id) on delete cascade,
  room_id uuid references room(id) on delete set null,
  day integer not null check (day between 1 and 7),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);

create unique index session_room_conflict
on session(room_id, day, start_time, end_time)
where room_id is not null;

create unique index session_class_conflict
on session(class_id, day, start_time, end_time);

-- =========================================================
-- DESIGNATION
-- =========================================================

create table designation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  campus_id uuid references campus(id) on delete cascade,
  department_id uuid references department(id) on delete cascade,
  program_campus_id uuid references program_campus(id) on delete cascade,
  room_id uuid references room(id) on delete cascade,
  job_title text not null,
  load integer check (load >= 0),
  designated_at timestamptz default now(),

  constraint designation_role_context_rules check (
    (
      lower(trim(job_title)) in (
        'university president',
        'director for instruction'
      )
    )
    or (
      lower(trim(job_title)) = 'program chairperson'
      and program_campus_id is not null
    )
    or (
      lower(trim(job_title)) = 'college dean'
      and department_id is not null
    )
    or (
      lower(trim(job_title)) = 'campus director'
      and campus_id is not null
    )
    or (
      lower(trim(job_title)) not in (
        'university president',
        'director for instruction',
        'program chairperson',
        'college dean',
        'campus director'
      )
      and (
        campus_id is not null
        or department_id is not null
        or program_campus_id is not null
        or room_id is not null
      )
    )
  )
);

create unique index unique_university_president
on designation(job_title)
where job_title='University President';

create unique index unique_director_instruction
on designation(job_title)
where job_title='Director for Instruction';

create unique index unique_campus_director_per_campus
on designation(campus_id)
where lower(trim(job_title)) = 'campus director'
  and campus_id is not null;

-- =========================================================
-- EVALUATION
-- =========================================================

create table evaluation (
  id uuid primary key default gen_random_uuid(),
  designation_id uuid not null references designation(id) on delete cascade,
  schedule_id uuid not null references schedule(id) on delete cascade,
  evaluation_level integer check (evaluation_level >= 0),
  evaluator_role text,
  status evaluation_status_enum not null default 'PENDING',
  comment text,
  created_at timestamptz default now(),
  unique(designation_id, schedule_id)
);