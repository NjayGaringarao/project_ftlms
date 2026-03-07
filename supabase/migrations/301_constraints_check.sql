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
