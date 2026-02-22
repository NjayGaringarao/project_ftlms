-- ============================================
-- RESET ALL TABLES IN PUBLIC
-- ============================================

do $$
declare
    r record;
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


-- ============================================
-- EXTENSIONS
-- ============================================

create extension if not exists pgcrypto;


-- ============================================
-- ENUMS
-- ============================================

create type employment_status_enum as enum ('FULL_TIME', 'PART_TIME');

create type evaluation_status_enum as enum (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

create type department_type_enum as enum (
    'ACADEMIC',
    'ADMINISTRATIVE',
    'STUDENT_SERVICES',
    'EXTENSION_SERVICES'
);


-- ============================================
-- ACADEMIC RANK
-- ============================================

create table academic_rank (
    id uuid primary key default gen_random_uuid(),
    number integer unique not null,
    title text unique not null,
    description text
);


-- ============================================
-- USER (extends auth.users)
-- ============================================

create table "user" (
    id uuid primary key references auth.users(id) on delete cascade,
    academic_rank_id uuid references academic_rank(id) on delete set null,
    employment_status employment_status_enum not null
);


-- ============================================
-- IDENTITY (1:1)
-- ============================================

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


-- ============================================
-- DEGREE
-- ============================================

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


-- ============================================
-- CAMPUS
-- ============================================

create table campus (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    address text,
    zip_code text
);


-- ============================================
-- DEPARTMENT
-- (University-wide, not campus-specific)
-- ============================================

create table department (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    name text not null,
    type department_type_enum not null,
    description text
);


-- ============================================
-- PROGRAM
-- (Local for each campus referencing department)
-- ============================================

create table program (
    id uuid primary key default gen_random_uuid(),
    department_id uuid not null references department(id) on delete cascade,
    campus_id uuid not null references campus(id) on delete cascade,
    name text not null,
    code text unique not null,
    description text,
    unique(department_id, name)
);


-- ============================================
-- ROOM
-- ============================================

create table room (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid not null references campus(id) on delete cascade,
    code text unique not null,
    name text 
);


-- ============================================
-- DESIGNATION
-- ============================================

create table designation (       
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references "user"(id) on delete cascade,

    campus_id uuid references campus(id) on delete cascade,
    department_id uuid references department(id) on delete cascade,
    program_id uuid references program(id) on delete cascade,
    room_id uuid references room(id) on delete cascade,

    job_title text not null,
    load integer check (load >= 0),
    is_active boolean not null default true,
    designated_at timestamptz not null default now(),

    -- If program exists, department must exist
    constraint designation_program_requires_department check (
        program_id is null or department_id is not null
    )

    -- Director for Instruction - only one active
    CREATE UNIQUE INDEX idx_unique_director_for_instruction 
    ON designation(job_title) 
    WHERE job_title = 'Director for Instruction' AND is_active IS TRUE;

    -- University President - only one active
    CREATE UNIQUE INDEX idx_unique_university_president 
    ON designation(job_title) 
    WHERE job_title = 'University President' AND is_active IS TRUE;

);


-- ============================================
-- ACADEMIC TERM
-- ============================================

create table academic_term (
    id uuid primary key default gen_random_uuid(),
    academic_year text not null,
    term_code text not null,
    sequence integer not null,
    start date,
    "end" date,
    check ("end" is null or "end" >= start),
    unique (academic_year, term_code)
);


-- ============================================
-- SCHEDULE
-- ============================================

create table schedule (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references "user"(id) on delete cascade,
    academic_term_id uuid not null references academic_term(id) on delete cascade,
    updated_at timestamptz not null default now(),
    unique(user_id, academic_term_id)
);


-- ============================================
-- BLOCK
-- ============================================

create table block (
    id uuid primary key default gen_random_uuid(),
    program_id uuid not null references program(id) on delete cascade,
    year_level integer not null,
    section text not null,
    unique(program_id, year_level, section)
);


-- ============================================
-- COURSE
-- ============================================

create table course (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid not null references campus(id) on delete cascade,
    academic_term_id uuid not null references academic_term(id) on delete cascade,
    title text not null,
    lecture_hour numeric(4,2) default 0 check (lecture_hour >= 0),
    laboratory_hour numeric(4,2) default 0 check (laboratory_hour >= 0)
);


-- ============================================
-- CLASS
-- ============================================

create table class (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid not null references schedule(id) on delete cascade,
    course_id uuid not null references course(id) on delete cascade,
    block_id uuid references block(id) on delete set null,
    student_count integer check (student_count >= 0)
);


-- ============================================
-- SESSION
-- ============================================

create table session (
    id uuid primary key default gen_random_uuid(),
    class_id uuid not null references class(id) on delete cascade,
    room_id uuid references room(id) on delete set null,
    day integer not null check (day between 1 and 7),
    start_time time not null,
    end_time time not null,
    check (end_time > start_time)
);

-- Prevent exact room time duplication
create unique index session_room_conflict
on session(room_id, day, start_time, end_time)
where room_id is not null;

-- Prevent exact duplicate class timeslot
create unique index session_class_conflict
on session(class_id, day, start_time, end_time);


-- ============================================
-- EVALUATION
-- ============================================

create table evaluation (
    id uuid primary key default gen_random_uuid(),
    designation_id uuid not null references designation(id) on delete cascade,
    schedule_id uuid not null references schedule(id) on delete cascade,
    evaluation_level integer check (evaluation_level >= 0),
    evaluator_role text,
    status evaluation_status_enum not null default 'PENDING',
    comment text,
    created_at timestamptz not null default now(),
    unique(designation_id, schedule_id)
);