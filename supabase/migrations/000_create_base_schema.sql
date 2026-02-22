-- Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-------------------------------------------------
-- RANK
-------------------------------------------------
create table rank (
    id uuid primary key default gen_random_uuid(),
    number integer unique not null,
    title text unique not null,
    description text
);

-------------------------------------------------
-- DEPARTMENT
-------------------------------------------------
create table department (
    id uuid primary key default gen_random_uuid(),
    dean_id uuid,
    code text unique not null,
    name text not null,
    type text,
    description text
);

-------------------------------------------------
-- USER (extends auth.users)
-------------------------------------------------
create table "user" (
    id uuid primary key references auth.users(id) on delete cascade,
    rank_id uuid references rank(id) on delete set null,
    employment_status text
);

alter table department
    add constraint department_dean_id_fkey
    foreign key (dean_id) references "user"(id) on delete set null;

-------------------------------------------------
-- IDENTITY (1:1 with user)
-------------------------------------------------
create table identity (
    user_id uuid primary key references "user"(id) on delete cascade,
    first_name text not null,
    middle_name text,
    last_name text not null,
    extension text,
    birth_date date not null,
    address text,
    zip_code text,
    contact_number text
);

-------------------------------------------------
-- CAMPUS
-------------------------------------------------
create table campus (
    id uuid primary key default gen_random_uuid(),
    director_id uuid,
    name text unique not null,
    address text,
    zip_code text
);

alter table campus
    add constraint campus_director_id_fkey
    foreign key (director_id) references "user"(id) on delete set null;

-------------------------------------------------
-- DEGREE
-------------------------------------------------
create table degree (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references "user"(id) on delete cascade,
  academic_level text not null,
  degree_type text not null,
  field_of_study text not null,
  year_graduated int,
  institution text not null,
  country_code text not null,
    created_at timestamptz default now(), 
    updated_at timestamptz default now()
);

-------------------------------------------------
-- DESIGNATION
-------------------------------------------------
create table designation (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references "user"(id) on delete cascade,
    campus_id uuid references campus(id) on delete cascade,
    position text not null,
    department_id uuid references department(id) on delete set null,
    load int
);

-------------------------------------------------
-- PROGRAM
-------------------------------------------------
create table program (
    id uuid primary key default gen_random_uuid(),
    department_id uuid references department(id) on delete set null,
    campus_id uuid references campus(id) on delete set null,
    chair_id uuid references "user"(id) on delete set null,
    name text not null,
    code text unique not null,
    description text
);

-------------------------------------------------
-- TERM
-------------------------------------------------
create table term (
    id uuid primary key default gen_random_uuid(),
    academic_year text not null,
    "order" integer not null,
    start date,
    "end" date
);

-------------------------------------------------
-- SCHEDULE
-------------------------------------------------
create table schedule (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references "user"(id) on delete cascade,
    semester_id uuid not null references term(id) on delete cascade,
    updated_at timestamptz default now()
);

-------------------------------------------------
-- COURSE
-------------------------------------------------
create table course (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid references campus(id) on delete set null,
    semester_id uuid references term(id) on delete set null,
    title text not null,
    lecture_hour numeric(4,2),
    laboratory_hour numeric(4,2)
);

-------------------------------------------------
-- BLOCK
-------------------------------------------------
create table block (
    id uuid primary key default gen_random_uuid(),
    program_id uuid not null references program(id) on delete cascade,
    year_level integer not null,
    section text not null
);

-------------------------------------------------
-- CLASS
-------------------------------------------------
create table class (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid not null references schedule(id) on delete cascade,
    course_id uuid not null references course(id) on delete cascade,
    block_id uuid references block(id) on delete set null,
    student_count integer
);

-------------------------------------------------
-- ROOM
-------------------------------------------------
create table room (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid references campus(id) on delete set null,
    custodian_id uuid references "user"(id) on delete set null,
    code text unique not null,
    name text
);

-------------------------------------------------
-- SESSION
-------------------------------------------------
create table session (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references class(id) on delete cascade,
    room_id uuid references room(id) on delete set null,
    day integer not null, -- 1 = Monday (your app decides convention)
    start_time time not null,
    end_time time not null,
    check (end_time > start_time)
);

-------------------------------------------------
-- EVALUATOR
-------------------------------------------------
create table evaluator (
    user_id uuid primary key references "user"(id) on delete cascade,
    role text,
    evaluation_level integer,
    designated_at timestamptz default now()
);

-------------------------------------------------
-- EVALUATION
-------------------------------------------------
create table evaluation (
    id uuid primary key default gen_random_uuid(),
    evaluator_id uuid not null references evaluator(user_id) on delete cascade,
    schedule_id uuid not null references schedule(id) on delete cascade,
    evaluation_level integer,
    evaluator_role text,
    status text,
    comment text,
    created_at timestamptz default now()
);