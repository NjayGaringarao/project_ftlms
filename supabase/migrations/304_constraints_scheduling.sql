do $$
begin
  -- Schedule should be unique per user and academic term.
  if not exists (
    select 1 from pg_constraint
    where conname = 'schedule_user_term_unique'
      and conrelid = 'public.schedule'::regclass
  ) then
    alter table public.schedule
      add constraint schedule_user_term_unique unique (user_id, academic_term_id);
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

  -- session_time_range_valid remains owned by 301_constraints_check.sql.
end;
$$;

create index if not exists session_class_day_time_idx
  on public.session (class_id, day, start_time, end_time);

create index if not exists class_block_block_idx
  on public.class_block (block_id);

create index if not exists class_schedule_course_idx
  on public.class (schedule_id, course_id);
