do $$
begin
  -- Class code uniqueness scoped by instructor schedule and course.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_schedule_course_code_unique'
      and conrelid = 'public.class'::regclass
  ) then
    alter table public.class
      add constraint class_schedule_course_code_unique
      unique (schedule_id, course_id, code);
  end if;

  -- Prevent duplicate block links within the same class.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_block_unique'
      and conrelid = 'public.class_block'::regclass
  ) then
    alter table public.class_block
      add constraint class_block_unique
      unique (class_id, block_id);
  end if;

  -- V6 block identity is term-aware (curriculum-independent).
  if not exists (
    select 1 from pg_constraint
    where conname = 'block_major_term_year_section_unique'
      and conrelid = 'public.block'::regclass
  ) then
    alter table public.block
      add constraint block_major_term_year_section_unique
      unique (major_offering_id, academic_term_id, year_level, section);
  end if;

  -- Ensure session time range remains valid.
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_time_range_valid'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      add constraint session_time_range_valid
      check (end_time > start_time);
  end if;
end;
$$;

create index if not exists session_class_day_time_idx
  on public.session (class_id, day, start_time, end_time);

create index if not exists class_block_block_idx
  on public.class_block (block_id);

create index if not exists class_schedule_course_idx
  on public.class (schedule_id, course_id);
