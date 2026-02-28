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

  -- Department code and name should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'department_code_unique'
      and conrelid = 'public.department'::regclass
  ) then
    alter table public.department
      add constraint department_code_unique unique (code);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'department_name_unique'
      and conrelid = 'public.department'::regclass
  ) then
    alter table public.department
      add constraint department_name_unique unique (name);
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

  -- Curriculum should be unique across the university.
  if not exists (
    select 1 from pg_constraint
    where conname = 'curriculum_major_series_revised_unique'
      and conrelid = 'public.curriculum'::regclass
  ) then
    alter table public.curriculum
      add constraint curriculum_major_series_revised_unique
      unique nulls not distinct (major_id, series_year, revised_year);
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

 -- Multiple same academic term within a curriculum is not allowed.
  if not exists (
    select 1 from pg_constraint
    where conname = 'curriculum_academic_term_unique'
      and conrelid = 'public.curriculum_at'::regclass
  ) then
    alter table public.curriculum_at
      add constraint curriculum_academic_term_unique unique (curriculum_id, academic_term_id);
  end if;

  -- Courses within the same curriculum regardless of academic term should be unique.
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_curriculum_term_unique'
      and conrelid = 'public.course_c_t'::regclass
  ) then
    alter table public.course_c_t
      add constraint course_curriculum_term_unique unique (curriculum_at_id, course_id);
  end if;

  -- Program Offering within the campus should be unique.
  if not exists (
    select 1 from pg_constraint
    where conname = 'program_campus_unique'
      and conrelid = 'public.program_campus'::regclass
  ) then
    alter table public.program_campus
      add constraint program_campus_unique unique (campus_id, program_id);
  end if;

  -- Major Offering within the campus should be unique
  if not exists (
    select 1 from pg_constraint
    where conname = 'major_program_campus_unique'
      and conrelid = 'public.major_p_c'::regclass
  ) then
    alter table public.major_p_c
      add constraint major_program_campus_unique unique (program_campus_id, major_id);
  end if;

 -- Block section should be unique within a curriculum, campus offering of programs and major, and year level.
  if not exists (
    select 1 from pg_constraint
    where conname = 'block_section_unique'
      and conrelid = 'public.block'::regclass
  ) then
    alter table public.block
      add constraint block_section_unique unique (major_p_c_id, curriculum_id, year_level, section);
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
  
  -- A session should not have overlapping time slots in the same room or for the same class.
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_room_slot_unique'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      add constraint session_room_slot_unique unique (room_id, day, start_time, end_time);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_class_slot_unique'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      add constraint session_class_slot_unique unique (class_id, day, start_time, end_time);
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
