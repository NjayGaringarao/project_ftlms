-- =========================================================
-- TRIGGERS: Campus-college load workflow validation
-- =========================================================

create or replace function public.designation_program_offering_scope(
  p_designation_id uuid
)
returns table (
  campus_id uuid,
  college_id uuid
)
language sql
stable
as $$
  select po.campus_id, p.college_id
  from public.designation d
  join public.program_offering po on po.id = d.program_offering_id
  join public.program p on p.id = po.program_id
  where d.id = p_designation_id
    and d.job_title = 'Program Chairperson'
$$;

create or replace function public.trg_validate_campus_college_load_revision()
returns trigger
language plpgsql
as $$
declare
  v_load public.campus_college_load%rowtype;
  v_scope record;
begin
  select *
  into v_load
  from public.campus_college_load
  where id = new.campus_college_load_id;

  if v_load.id is null then
    raise exception 'Campus-college load does not exist.';
  end if;

  if v_load.status not in ('DRAFT', 'RETURNED') then
    raise exception 'Only draft or returned loads can be submitted by Program Chairpersons.';
  end if;

  if new.submitted_by_user_id is null then
    raise exception 'Submitter user is required.';
  end if;

  if new.submitted_by_designation_id is null then
    raise exception 'Submitter designation is required.';
  end if;

  select *
  into v_scope
  from public.designation_program_offering_scope(new.submitted_by_designation_id);

  if v_scope.campus_id is null then
    raise exception 'Submitter must be a Program Chairperson with a program offering.';
  end if;

  if v_scope.campus_id is distinct from v_load.campus_id
     or v_scope.college_id is distinct from v_load.college_id then
    raise exception 'Program Chairperson designation does not match load campus and college.';
  end if;

  if new.revision_number < 1 then
    raise exception 'Revision number must be positive.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_campus_college_load_revision
on public.campus_college_load_revision;

create trigger validate_campus_college_load_revision
before insert on public.campus_college_load_revision
for each row execute function public.trg_validate_campus_college_load_revision();

create or replace function public.trg_apply_campus_college_load_revision()
returns trigger
language plpgsql
as $$
begin
  update public.campus_college_load
  set status = 'SUBMITTED',
      current_step = 'CAMPUS_DIRECTOR',
      updated_by_user_id = new.submitted_by_user_id,
      updated_by_designation_id = new.submitted_by_designation_id,
      updated_at = now()
  where id = new.campus_college_load_id;

  return null;
end;
$$;

drop trigger if exists apply_campus_college_load_revision
on public.campus_college_load_revision;

create trigger apply_campus_college_load_revision
after insert on public.campus_college_load_revision
for each row execute function public.trg_apply_campus_college_load_revision();

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

  if v_load.status <> 'SUBMITTED' then
    raise exception 'Only submitted loads can be evaluated.';
  end if;

  if new.step::text <> v_load.current_step::text then
    raise exception 'Evaluation step does not match the current load step.';
  end if;

  -- System-generated evaluations (from return-on-source-change invalidation)
  -- must return the load with a comment and skip evaluator/designation checks.
  if new.system_generated then
    if new.status <> 'RETURNED' then
      raise exception 'System-generated evaluations must return the load.';
    end if;

    if length(btrim(coalesce(new.comment, ''))) = 0 then
      raise exception 'System-generated returns require a comment.';
    end if;

    return new;
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

drop trigger if exists validate_campus_college_load_evaluation
on public.campus_college_load_evaluation;

create trigger validate_campus_college_load_evaluation
before insert on public.campus_college_load_evaluation
for each row execute function public.trg_validate_campus_college_load_evaluation();

create or replace function public.trg_apply_campus_college_load_evaluation()
returns trigger
language plpgsql
as $$
declare
  v_load_id uuid;
begin
  select revision.campus_college_load_id
  into v_load_id
  from public.campus_college_load_revision revision
  where revision.id = new.campus_college_load_revision_id;

  if new.status = 'RETURNED' then
    update public.campus_college_load
    set status = 'RETURNED',
        current_step = 'PROGRAM_CHAIR',
        updated_by_user_id = new.evaluator_user_id,
        updated_by_designation_id = new.designation_id,
        updated_at = now()
    where id = v_load_id;

    return null;
  end if;

  update public.campus_college_load
  set status = case
        when new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
          then 'APPROVED'::public.campus_college_load_status_enum
        else 'SUBMITTED'::public.campus_college_load_status_enum
      end,
      current_step = case
        when new.step = 'CAMPUS_DIRECTOR'
          then 'DIRECTOR_FOR_INSTRUCTION'::public.campus_college_load_step_enum
        when new.step = 'DIRECTOR_FOR_INSTRUCTION'
          then 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'::public.campus_college_load_step_enum
        else 'COMPLETED'::public.campus_college_load_step_enum
      end,
      updated_by_user_id = new.evaluator_user_id,
      updated_by_designation_id = new.designation_id,
      updated_at = now()
  where id = v_load_id;

  return null;
end;
$$;

drop trigger if exists apply_campus_college_load_evaluation
on public.campus_college_load_evaluation;

create trigger apply_campus_college_load_evaluation
after insert on public.campus_college_load_evaluation
for each row execute function public.trg_apply_campus_college_load_evaluation();
