-- Enable UUID generation
create extension if not exists "pgcrypto";

--------------------------------------------------
-- CORE REFERENCE TABLES
--------------------------------------------------

create table rank (
  id uuid primary key default gen_random_uuid(),
  number int not null,
  title text not null,
  description text
);

create table department (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text
);

create table campus (
  id uuid primary key default gen_random_uuid(),
  director_id uuid,
  name text not null,
  address text,
  zip_code text
);

create table college (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references department(id) on delete set null,
  campus_id uuid references campus(id) on delete set null,
  description text
);

create table semester (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null,
  term text not null,
  start date not null,
  "end" date not null
);

--------------------------------------------------
-- USER DOMAIN
--------------------------------------------------

create table "user" (
  id uuid primary key references auth.users(id) on delete cascade,
  rank_id uuid references rank(id) on delete set null,
  first_name text not null,
  middle_name text,
  last_name text not null,
  extension text,
  employment_status text
);

create table degree (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  level text not null,
  name text not null,
  year_earned int
);

create table designation (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  position text not null,
  department text,
  load int
);

--------------------------------------------------
-- PROGRAM STRUCTURE
--------------------------------------------------

create table program (
  id uuid primary key default gen_random_uuid(),
  college_id uuid references college(id) on delete set null,
  chair_id uuid references "user"(id) on delete set null,
  name text not null,
  description text
);

create table block (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references program(id) on delete cascade,
  year_level int not null,
  section text not null
);

--------------------------------------------------
-- ACADEMIC SCHEDULING
--------------------------------------------------

create table schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references "user"(id) on delete cascade,
  semester_id uuid not null references semester(id) on delete cascade,
  updated_at timestamptz default now()
);

create table schedule_college (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedule(id) on delete cascade,
  college_id uuid not null references college(id) on delete cascade,
  unique (schedule_id, college_id)
);

create table course (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campus(id) on delete set null,
  semester_id uuid references semester(id) on delete set null,
  code text not null,
  title text not null,
  lecture_hour int default 0,
  laboratory_hour int default 0
);

create table class (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references schedule(id) on delete cascade,
  course_id uuid not null references course(id) on delete cascade,
  block_id uuid references block(id) on delete set null,
  student_count int default 0
);

--------------------------------------------------
-- ROOMS & SESSIONS
--------------------------------------------------

create table room (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campus(id) on delete set null,
  custodian_id uuid references "user"(id) on delete set null,
  code text not null,
  name text not null
);

create table session (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references class(id) on delete cascade,
  room_id uuid references room(id) on delete set null,
  day text not null,
  start_time time not null,
  end_time time not null
);

--------------------------------------------------
-- EVALUATION SYSTEM
--------------------------------------------------

create table evaluator (
  user_id uuid primary key references "user"(id) on delete cascade,
  role text not null,
  evaluation_level int not null,
  designated_at timestamptz default now()
);

create table evaluation (
  id uuid primary key default gen_random_uuid(),
  evaluator_id uuid not null references evaluator(user_id) on delete cascade,
  schedule_id uuid not null references schedule(id) on delete cascade,
  evaluation_level int not null,
  evaluator_role text not null,
  status text not null,
  comment text,
  created_at timestamptz default now()
);