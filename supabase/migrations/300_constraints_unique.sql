do $$
begin

  -- Campus name should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_name_unique'
      and conrelid = 'public.campus'::regclass
  ) then
    alter table public.campus
      add constraint campus_name_unique unique (name);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_code_unique'
      and conrelid = 'public.campus'::regclass
  ) then
    alter table public.campus
      add constraint campus_code_unique unique (code);
  end if;

  -- College code and name should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'college_code_unique'
      and conrelid = 'public.college'::regclass
  ) then
    alter table public.college
      add constraint college_code_unique unique (code);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'college_name_unique'
      and conrelid = 'public.college'::regclass
  ) then
    alter table public.college
      add constraint college_name_unique unique (name);
  end if;

  -- Program code should be unique across the university. 
  if not exists (
    select 1 from pg_constraint
    where conname = 'program_code_unique'
      and conrelid = 'public.program'::regclass
  ) then
    alter table public.program
      add constraint program_code_unique unique (code);
  end if;

 -- Major code should be unique within a program.
  if not exists (
    select 1 from pg_constraint
    where conname = 'major_program_code_unique'
      and conrelid = 'public.major'::regclass
  ) then
    alter table public.major
      add constraint major_program_code_unique unique (program_id, code);
  end if;

  -- Course code should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_code_unique'
      and conrelid = 'public.course'::regclass
  ) then
    alter table public.course
      add constraint course_code_unique unique (code);
  end if;

  -- Academic term should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_year_term_code_unique'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_year_term_code_unique
      unique (academic_year_start, academic_year_end, type, term_order, code);
  end if;


  -- Academic rank number and title should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_rank_number_unique'
      and conrelid = 'public.academic_rank'::regclass
  ) then
    alter table public.academic_rank
      add constraint academic_rank_number_unique unique (number);
  end if;

 -- Academic rank title should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_rank_title_unique'
      and conrelid = 'public.academic_rank'::regclass
  ) then
    alter table public.academic_rank
      add constraint academic_rank_title_unique unique (title);
  end if;

  -- Room code should be unique within a campus.
  if not exists (
    select 1 from pg_constraint
    where conname = 'room_campus_code_unique'
      and conrelid = 'public.room'::regclass
  ) then
    alter table public.room
      add constraint room_campus_code_unique unique (campus_id, code);
  end if;
  
end;
$$;
