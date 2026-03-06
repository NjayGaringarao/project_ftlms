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

  -- Program Offering within the campus should be unique.
  if not exists (
    select 1 from pg_constraint
    where conname = 'program_offering_unique'
      and conrelid = 'public.program_offering'::regclass
  ) then
    alter table public.program_offering
      add constraint program_offering_unique unique (campus_id, program_id);
  end if;

  -- Major Offering within the campus should be unique
  if not exists (
    select 1 from pg_constraint
    where conname = 'major_offering_unique'
      and conrelid = 'public.major_offering'::regclass
  ) then
    alter table public.major_offering
      add constraint major_offering_unique unique (program_offering_id, major_id);
  end if;

 -- Block section should be unique per major offering and academic term.
  if not exists (
    select 1 from pg_constraint
    where conname = 'block_major_term_year_section_unique'
      and conrelid = 'public.block'::regclass
  ) then
    alter table public.block
      add constraint block_major_term_year_section_unique
      unique (major_offering_id, academic_term_id, year_level, section);
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

 -- Academic term should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'schedule_user_term_unique'
      and conrelid = 'public.schedule'::regclass
  ) then
    alter table public.schedule
      add constraint schedule_user_term_unique unique (user_id, academic_term_id);
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
  
  -- Class code uniqueness scoped by schedule and course.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_schedule_course_code_unique'
      and conrelid = 'public.class'::regclass
  ) then
    alter table public.class
      add constraint class_schedule_course_code_unique
      unique (schedule_id, course_id, code);
  end if;

  -- No duplicate block links within the same class.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_block_unique'
      and conrelid = 'public.class_block'::regclass
  ) then
    alter table public.class_block
      add constraint class_block_unique
      unique (class_id, block_id);
  end if;

  -- Multiple same evaluation for a designation and schedule is not allowed.
  if not exists (
    select 1 from pg_constraint
    where conname = 'evaluation_designation_schedule_unique'
      and conrelid = 'public.evaluation'::regclass
  ) then
    alter table public.evaluation
      add constraint evaluation_designation_schedule_unique unique (designation_id, schedule_id);
  end if;
end;
$$;
