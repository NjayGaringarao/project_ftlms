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
    sc1.class_id,
    sc2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.room_id is not null
   and s1.room_id = s2.room_id
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.session_class sc1
    on sc1.session_id = s1.id
  join public.session_class sc2
    on sc2.session_id = s2.id
  join public.course_utilization cu1
    on cu1.class_id = sc1.class_id
  join public.course_utilization cu2
    on cu2.class_id = sc2.class_id
  join public.block b1
    on b1.id = cu1.block_id
  join public.block b2
    on b2.id = cu2.block_id
  where b1.academic_term_id = p_academic_term_id
    and b2.academic_term_id = p_academic_term_id;
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
    uc1.user_id,
    s1.id as session_id,
    s2.id as conflicting_session_id,
    s1.day,
    s1.start_time,
    s1.end_time,
    s2.start_time as conflicting_start_time,
    s2.end_time as conflicting_end_time,
    sc1.class_id,
    sc2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.session_class sc1
    on sc1.session_id = s1.id
  join public.session_class sc2
    on sc2.session_id = s2.id
  join public.user_class uc1
    on uc1.class_id = sc1.class_id
  join public.user_class uc2
    on uc2.class_id = sc2.class_id
   and uc2.user_id = uc1.user_id
  join public.course_utilization cu1
    on cu1.class_id = sc1.class_id
  join public.block b1
    on b1.id = cu1.block_id
  join public.course_utilization cu2
    on cu2.class_id = sc2.class_id
  join public.block b2
    on b2.id = cu2.block_id
  where b1.academic_term_id = p_academic_term_id
    and b2.academic_term_id = p_academic_term_id;
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
    cu1.block_id,
    s1.id as session_id,
    s2.id as conflicting_session_id,
    s1.day,
    s1.start_time,
    s1.end_time,
    s2.start_time as conflicting_start_time,
    s2.end_time as conflicting_end_time,
    sc1.class_id,
    sc2.class_id as conflicting_class_id
  from public.session s1
  join public.session s2
    on s1.id < s2.id
   and s1.day = s2.day
   and s1.start_time < s2.end_time
   and s2.start_time < s1.end_time
  join public.session_class sc1
    on sc1.session_id = s1.id
  join public.session_class sc2
    on sc2.session_id = s2.id
  join public.course_utilization cu1
    on cu1.class_id = sc1.class_id
  join public.course_utilization cu2
    on cu2.class_id = sc2.class_id
   and cu2.block_id = cu1.block_id
  join public.block b
    on b.id = cu1.block_id
  where b.academic_term_id = p_academic_term_id;
$$;
