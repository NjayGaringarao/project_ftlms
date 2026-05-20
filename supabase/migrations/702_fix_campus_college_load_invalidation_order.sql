-- =========================================================
-- AMENDMENT: Fix campus-college load invalidation ordering
-- Description:
--   The evaluation apply trigger owns the submitted -> returned transition.
--   Keeping the state update outside the same statement avoids CTE execution
--   order races with the evaluation validation trigger.
-- =========================================================

create or replace function public.invalidate_submitted_campus_college_loads_for_scope(
  p_campus_id uuid,
  p_college_id uuid,
  p_academic_term_id uuid,
  p_reason text default 'Returned automatically because source schedule data changed after submission. Please review the latest schedule and resubmit the campus-college load.'
)
returns void
language plpgsql
as $$
begin
  if p_campus_id is null
     or p_college_id is null
     or p_academic_term_id is null then
    return;
  end if;

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    status,
    comment,
    system_generated
  )
  select
    revision.id,
    load.current_step::text::public.campus_college_load_evaluation_step_enum,
    'RETURNED'::public.campus_college_load_evaluation_status_enum,
    p_reason,
    true
  from public.campus_college_load load
  join lateral (
    select id
    from public.campus_college_load_revision revision
    where revision.campus_college_load_id = load.id
    order by revision.revision_number desc
    limit 1
  ) revision on true
  where load.campus_id = p_campus_id
    and load.college_id = p_college_id
    and load.academic_term_id = p_academic_term_id
    and load.status = 'SUBMITTED'
    and load.current_step in (
      'CAMPUS_DIRECTOR',
      'DIRECTOR_FOR_INSTRUCTION',
      'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
    )
  on conflict on constraint campus_college_load_evaluation_step_unique
  do nothing;
end;
$$;
