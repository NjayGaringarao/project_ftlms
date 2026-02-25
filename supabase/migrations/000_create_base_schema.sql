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

-- =========================================================
-- ENUMS
-- =========================================================


DROP TYPE IF EXISTS employment_status_enum CASCADE;
create type employment_status_enum as enum ('FULL_TIME', 'PART_TIME');

DROP TYPE IF EXISTS evaluation_status_enum CASCADE;
create type evaluation_status_enum as enum (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

DROP TYPE IF EXISTS department_type_enum CASCADE;
create type department_type_enum as enum (
    'ACADEMIC',
    'ADMINISTRATIVE',
    'STUDENT_SERVICES',
    'EXTENSION_SERVICES'
);

-- =========================================================
-- CORE STRUCTURAL ENTITIES
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
-- OFFERING ENTITIES
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

create table academic_term (
    id uuid primary key default gen_random_uuid(),
    academic_year text not null,
    term_code text not null,
    sequence integer not null,
    start date,
    "end" date,
    check ("end" is null or "end" >= start),
    unique(academic_year, term_code)
);

create table course_campus_at (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid not null references campus(id) on delete cascade,
    course_id uuid not null references course(id) on delete cascade,
    academic_term_id uuid not null references academic_term(id) on delete cascade,
    unique(campus_id, course_id, academic_term_id)
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
-- ACADEMIC OPERATIONS
-- =========================================================

create table block (
    id uuid primary key default gen_random_uuid(),
    major_p_c_id uuid not null references major_p_c(id) on delete cascade,
    year_level integer not null,
    section text not null,
    student_count integer check (student_count >= 0),
    unique(major_p_c_id, year_level, section)
);

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
    campus_course_at_id uuid not null references course_campus_at(id) on delete cascade,
    block_id uuid references block(id) on delete set null
);

create table room (
    id uuid primary key default gen_random_uuid(),
    campus_id uuid not null references campus(id) on delete cascade,
    code text unique not null,
    name text
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

    constraint designation_requires_context check (
        campus_id is not null
        or department_id is not null
        or program_campus_id is not null
        or room_id is not null
    )
);

-- Leadership uniqueness

create unique index unique_university_president
on designation(job_title)
where job_title = 'University President';

create unique index unique_director_instruction
on designation(job_title)
where job_title = 'Director for Instruction';

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

-- =========================================================
-- INTEGRITY TRIGGERS
-- =========================================================

-- Validate major belongs to program in program_campus

create or replace function validate_major_program_match()
returns trigger as $$
begin
    if not exists (
        select 1
        from major m
        join program_campus pc on pc.id = new.program_campus_id
        where m.id = new.major_id
        and m.program_id = pc.program_id
    ) then
        raise exception 'Major does not belong to program offered in this campus';
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_validate_major_program_match
before insert or update on major_p_c
for each row
execute function validate_major_program_match();

-- Validate class term matches schedule term

create or replace function validate_class_term_match()
returns trigger as $$
begin
    if not exists (
        select 1
        from schedule s
        join course_campus_at cca
            on cca.id = new.campus_course_at_id
        where s.id = new.schedule_id
        and s.academic_term_id = cca.academic_term_id
    ) then
        raise exception 'Class term does not match schedule term';
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_validate_class_term_match
before insert or update on class
for each row
execute function validate_class_term_match();

-- Validate program_campus matches campus in designation

create or replace function validate_designation_program_campus()
returns trigger as $$
begin
    if new.program_campus_id is not null and new.campus_id is not null then
        if not exists (
            select 1
            from program_campus pc
            where pc.id = new.program_campus_id
            and pc.campus_id = new.campus_id
        ) then
            raise exception 'Program campus does not belong to given campus';
        end if;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger trg_validate_designation_program_campus
before insert or update on designation
for each row
execute function validate_designation_program_campus();