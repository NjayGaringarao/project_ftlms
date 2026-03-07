do $$
begin

  -- Course lecture hour and laboratory hour should be non-negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_lecture_hour_nonnegative'
      and conrelid = 'public.course'::regclass
  ) then
    alter table public.course
      add constraint course_lecture_hour_nonnegative check (lecture_hour >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_laboratory_hour_nonnegative'
      and conrelid = 'public.course'::regclass
  ) then
    alter table public.course
      add constraint course_laboratory_hour_nonnegative check (laboratory_hour >= 0);
  end if;

  -- Academic term year should be reasonable and consistent.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_year_start_minimum'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_year_start_minimum check (academic_year_start >= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_year_range_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_year_range_valid
      check (academic_year_end >= academic_year_start);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_date_range_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_date_range_valid
      check ("end" >= start);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_type_term_order_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_type_term_order_valid
      check (
        (type = 'SEMESTER' and term_order in ('FIRST', 'SECOND'))
        or (type = 'TRIMESTER' and term_order in ('FIRST', 'SECOND', 'THIRD'))
        or (type = 'QUARTER' and term_order in ('FIRST', 'SECOND', 'THIRD', 'FOURTH'))
      );
  end if;

  -- Block's student count should be non negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'block_student_count_nonnegative'
      and conrelid = 'public.block'::regclass
  ) then
    alter table public.block
      add constraint block_student_count_nonnegative check (student_count >= 0);
  end if;

  -- Room capacity should be non-negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'room_capacity_nonnegative'
      and conrelid = 'public.room'::regclass
  ) then
    alter table public.room
      add constraint room_capacity_nonnegative check (capacity >= 0);
  end if;

  -- Session time range should be valid (end time should be after start time).
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_time_range_valid'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      add constraint session_time_range_valid check (end_time > start_time);
  end if;

  -- Designation load should be non-negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'designation_load_nonnegative'
      and conrelid = 'public.designation'::regclass
  ) then
    alter table public.designation
      add constraint designation_load_nonnegative check (load >= 0);
  end if;

  -- Designation role should have consistent context rules.
  if not exists (
    select 1 from pg_constraint
    where conname = 'designation_role_context_rules'
      and conrelid = 'public.designation'::regclass
  ) then
    alter table public.designation
      add constraint designation_role_context_rules
      check (
        (
          lower(trim(job_title::text)) in ('university president', 'director for instruction')
          and campus_id is null
          and college_id is null
          and program_offering_id is null
          and room_id is null
        )
        or (
          lower(trim(job_title::text)) = 'program chairperson'
          and program_offering_id is not null
          and campus_id is null
          and college_id is null
          and room_id is null
        )
        or (
          lower(trim(job_title::text)) = 'college dean'
          and college_id is not null
          and campus_id is null
          and program_offering_id is null
          and room_id is null
        )
        or (
          lower(trim(job_title::text)) = 'campus director'
          and campus_id is not null
          and college_id is null
          and program_offering_id is null
          and room_id is null
        )
        or (
          lower(trim(job_title::text)) not in (
            'university president',
            'director for instruction',
            'program chairperson',
            'college dean',
            'campus director'
          )
          and (
            campus_id is not null
            or college_id is not null
            or program_offering_id is not null
            or room_id is not null
          )
        )
      );
  end if;

  -- Evaluation level should be non-negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'evaluation_level_nonnegative'
      and conrelid = 'public.evaluation'::regclass
  ) then
    alter table public.evaluation
      add constraint evaluation_level_nonnegative check (evaluation_level >= 0);
  end if;
end;
$$;
