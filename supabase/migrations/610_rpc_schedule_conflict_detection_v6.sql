-- =========================================================
-- RPC (V6): SCHEDULE CONFLICT DETECTION
-- Description:
--   Uses class/class_block/session chain (legacy class_delivery removed).
-- =========================================================

drop function if exists public.detect_room_overlap_conflicts(uuid);
drop function if exists public.detect_instructor_overlap_conflicts(uuid);
drop function if exists public.detect_block_overlap_conflicts(uuid);

create or replace function public.detect_room_overlap_conflicts(
  p_academic_term_id uuid
)
returns table (
  session_id uuid,
  conflicting_session_id uuid,
  room_id uuid,
  day public.day_of_week_enum,
  start_time time,
  end_time time,
  conflicting_start_time time,
  conflicting_end_time time,
  class_id uuid,
  conflicting_class_id uuid
)
language sql
stable
set search_path = public
as $$
  select
    s1.id as session_id,
    s2.id as conflicting_session_id,
    s1.room_id,
    s1.day,
    s1.start_time,
    s1.end_time,
    s2.start_time as conflicting_start_time,
    s2.end_time as conflicting_end_time,
    s1.class_id,
    s2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.room_id is not null
   and s1.room_id = s2.room_id
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.class c1
    on c1.id = s1.class_id
  join public.class c2
    on c2.id = s2.class_id
  join public.schedule sch1
    on sch1.id = c1.schedule_id
  join public.schedule sch2
    on sch2.id = c2.schedule_id
  where sch1.academic_term_id = p_academic_term_id
    and sch2.academic_term_id = p_academic_term_id;
$$;

create or replace function public.detect_instructor_overlap_conflicts(
  p_academic_term_id uuid
)
returns table (
  user_id uuid,
  session_id uuid,
  conflicting_session_id uuid,
  day public.day_of_week_enum,
  start_time time,
  end_time time,
  conflicting_start_time time,
  conflicting_end_time time,
  class_id uuid,
  conflicting_class_id uuid
)
language sql
stable
set search_path = public
as $$
  select
    sch1.user_id,
    s1.id as session_id,
    s2.id as conflicting_session_id,
    s1.day,
    s1.start_time,
    s1.end_time,
    s2.start_time as conflicting_start_time,
    s2.end_time as conflicting_end_time,
    s1.class_id,
    s2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.class c1
    on c1.id = s1.class_id
  join public.class c2
    on c2.id = s2.class_id
  join public.schedule sch1
    on sch1.id = c1.schedule_id
  join public.schedule sch2
    on sch2.id = c2.schedule_id
  where sch1.academic_term_id = p_academic_term_id
    and sch2.academic_term_id = p_academic_term_id
    and sch1.user_id = sch2.user_id;
$$;

create or replace function public.detect_block_overlap_conflicts(
  p_academic_term_id uuid
)
returns table (
  block_id uuid,
  session_id uuid,
  conflicting_session_id uuid,
  day public.day_of_week_enum,
  start_time time,
  end_time time,
  conflicting_start_time time,
  conflicting_end_time time,
  class_id uuid,
  conflicting_class_id uuid
)
language sql
stable
set search_path = public
as $$
  select
    cb1.block_id,
    s1.id as session_id,
    s2.id as conflicting_session_id,
    s1.day,
    s1.start_time,
    s1.end_time,
    s2.start_time as conflicting_start_time,
    s2.end_time as conflicting_end_time,
    s1.class_id,
    s2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.class c1
    on c1.id = s1.class_id
  join public.class c2
    on c2.id = s2.class_id
  join public.schedule sch1
    on sch1.id = c1.schedule_id
  join public.schedule sch2
    on sch2.id = c2.schedule_id
  join public.class_block cb1
    on cb1.class_id = c1.id
  join public.class_block cb2
    on cb2.class_id = c2.id
   and cb2.block_id = cb1.block_id
  where sch1.academic_term_id = p_academic_term_id
    and sch2.academic_term_id = p_academic_term_id;
$$;
