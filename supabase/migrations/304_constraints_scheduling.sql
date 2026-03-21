do $$
begin
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

  -- Course utilization should be unique per block and course.
  if not exists (
    select 1 from pg_constraint
    where conname = 'course_utilization_block_course_unique'
      and conrelid = 'public.course_utilization'::regclass
  ) then
    alter table public.course_utilization
      add constraint course_utilization_block_course_unique
      unique (block_id, course_id);
  end if;

  -- One faculty per class.
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_class_class_unique'
      and conrelid = 'public.user_class'::regclass
  ) then
    alter table public.user_class
      add constraint user_class_class_unique
      unique (class_id);
  end if;

  -- No duplicate faculty-class links.
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_class_user_unique'
      and conrelid = 'public.user_class'::regclass
  ) then
    alter table public.user_class
      add constraint user_class_user_unique
      unique (user_id, class_id);
  end if;

  -- No duplicate session-class links.
  if not exists (
    select 1 from pg_constraint
    where conname = 'session_class_unique'
      and conrelid = 'public.session_class'::regclass
  ) then
    alter table public.session_class
      add constraint session_class_unique
      unique (class_id, session_id);
  end if;

  -- session_time_range_valid remains owned by 301_constraints_check.sql.
end;
$$;

create index if not exists session_day_time_idx
  on public.session (day, start_time, end_time);

create index if not exists course_utilization_block_idx
  on public.course_utilization (block_id);

create index if not exists course_utilization_class_idx
  on public.course_utilization (class_id);

create index if not exists course_utilization_course_idx
  on public.course_utilization (course_id);

create index if not exists user_class_user_idx
  on public.user_class (user_id);

create index if not exists user_class_class_idx
  on public.user_class (class_id);

create index if not exists session_class_class_idx
  on public.session_class (class_id);

create index if not exists session_class_session_idx
  on public.session_class (session_id);
