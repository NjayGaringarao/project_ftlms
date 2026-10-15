-- =========================================================
-- CAMPUS-COLLEGE LOAD: invalidate approved loads on source change
-- Description:
--   An approved load is a frozen snapshot too. If its source schedule
--   changes after VPAA approval, return it to the Program Chair and retain
--   the invalidation as a system-generated VPAA evaluation.
-- =========================================================

-- A system-generated invalidation is an additional event for the same step,
-- so regular evaluator decisions remain unique while invalidations are
-- retained in the workflow history.
alter table public.campus_college_load_evaluation
  drop constraint if exists campus_college_load_evaluation_step_unique;

create unique index if not exists campus_college_load_evaluation_step_unique
  on public.campus_college_load_evaluation (campus_college_load_revision_id, step)
  where not system_generated;

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
    case
      when load.status = 'APPROVED'
        then 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'::public.campus_college_load_evaluation_step_enum
      else load.current_step::text::public.campus_college_load_evaluation_step_enum
    end,
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
    and (
      (
        load.status = 'SUBMITTED'
        and load.current_step in (
          'CAMPUS_DIRECTOR',
          'DIRECTOR_FOR_INSTRUCTION',
          'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
        )
      )
      or (
        load.status = 'APPROVED'
        and load.current_step = 'COMPLETED'
      )
    )
  on conflict (campus_college_load_revision_id, step)
    where not system_generated
  do nothing;
end;
$$;

create or replace function public.trg_validate_campus_college_load_evaluation()
returns trigger
language plpgsql
as $$
declare
  v_load public.campus_college_load%rowtype;
  v_revision public.campus_college_load_revision%rowtype;
  v_designation_title text;
  v_designation_campus_id uuid;
begin
  select *
  into v_revision
  from public.campus_college_load_revision
  where id = new.campus_college_load_revision_id;

  if v_revision.id is null then
    raise exception 'Campus-college load revision does not exist.';
  end if;

  select *
  into v_load
  from public.campus_college_load
  where id = v_revision.campus_college_load_id;

  if v_load.id is null then
    raise exception 'Campus-college load does not exist.';
  end if;

  -- System-generated invalidations may return a load that was already
  -- approved, and use the VPAA step to identify the invalidated approval.
  if new.system_generated then
    if new.status <> 'RETURNED' then
      raise exception 'System-generated evaluations must return the load.';
    end if;

    if length(btrim(coalesce(new.comment, ''))) = 0 then
      raise exception 'System-generated returns require a comment.';
    end if;

    if not (
      (
        v_load.status = 'SUBMITTED'
        and new.step::text = v_load.current_step::text
      )
      or (
        v_load.status = 'APPROVED'
        and v_load.current_step = 'COMPLETED'
        and new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
      )
    ) then
      raise exception 'System-generated evaluation does not match the current load state.';
    end if;

    return new;
  end if;

  if v_load.status <> 'SUBMITTED' then
    raise exception 'Only submitted loads can be evaluated.';
  end if;

  if new.step::text <> v_load.current_step::text then
    raise exception 'Evaluation step does not match the current load step.';
  end if;

  if new.evaluator_user_id is null then
    raise exception 'Evaluator user is required.';
  end if;

  if new.designation_id is null then
    raise exception 'Evaluator designation is required.';
  end if;

  select d.job_title::text, d.campus_id
  into v_designation_title, v_designation_campus_id
  from public.designation d
  where d.id = new.designation_id;

  if v_designation_title is null then
    raise exception 'Evaluator designation does not exist.';
  end if;

  if new.step = 'CAMPUS_DIRECTOR' then
    if v_designation_title <> 'Campus Director' then
      raise exception 'Campus Director step requires Campus Director designation.';
    end if;

    if v_designation_campus_id is distinct from v_load.campus_id then
      raise exception 'Campus Director campus does not match load campus.';
    end if;
  elsif new.step = 'DIRECTOR_FOR_INSTRUCTION' then
    if v_designation_title <> 'Director for Instruction' then
      raise exception 'Director for Instruction step requires DI designation.';
    end if;
  elsif new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS' then
    if v_designation_title <> 'Vice President for Academic Affairs' then
      raise exception 'VPAA step requires VPAA designation.';
    end if;
  end if;

  return new;
end;
$$;
