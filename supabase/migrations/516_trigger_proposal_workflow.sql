-- =========================================================
-- TRIGGERS: Proposal workflow validation and evaluation
-- =========================================================

create or replace function public.trg_validate_campus_load_creation()
returns trigger
language plpgsql
as $$
declare
  v_designation_title text;
  v_designation_campus_id uuid;
begin
  if new.created_by_user_id is null then
    raise exception 'Campus proposal creator user is required.';
  end if;

  if new.created_by_designation_id is not null then
    select d.job_title::text, d.campus_id
    into v_designation_title, v_designation_campus_id
    from public.designation d
    where d.id = new.created_by_designation_id;

    if v_designation_title is null then
      raise exception 'Creator designation does not exist.';
    end if;

    if v_designation_title <> 'Campus Director' then
      raise exception 'Campus proposal can only be created with a Campus Director designation.';
    end if;

    if v_designation_campus_id is distinct from new.campus_id then
      raise exception 'Campus proposal creator campus does not match target campus.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_campus_load_creation
on public.campus_load;

create trigger validate_campus_load_creation
before insert on public.campus_load
for each row execute function public.trg_validate_campus_load_creation();

create or replace function public.trg_validate_campus_load_member()
returns trigger
language plpgsql
as $$
declare
  v_campus_id uuid;
  v_term_id uuid;
  v_source_campus_id uuid;
  v_source_term_id uuid;
  v_source_status public.proposal_lifecycle_enum;
begin
  select cp.campus_id, cp.academic_term_id
  into v_campus_id, v_term_id
  from public.campus_load cp
  where cp.id = new.campus_load_id;

  if v_campus_id is null then
    raise exception 'Campus proposal does not exist.';
  end if;

  select p.campus_id, p.academic_term_id, p.lifecycle_status
  into v_source_campus_id, v_source_term_id, v_source_status
  from public.faculty_load_proposal p
  where p.id = new.source_faculty_load_proposal_id;

  if v_source_campus_id is null then
    raise exception 'Source proposal does not exist.';
  end if;

  if v_source_campus_id is distinct from v_campus_id
     or v_source_term_id is distinct from v_term_id then
    raise exception 'Source proposal does not belong to the campus proposal scope.';
  end if;

  if v_source_status <> 'APPROVED' then
    raise exception 'Only approved individual proposals can be copied to campus proposal.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_campus_load_member
on public.campus_load_member;

create trigger validate_campus_load_member
before insert on public.campus_load_member
for each row execute function public.trg_validate_campus_load_member();

create or replace function public.trg_validate_faculty_load_evaluation()
returns trigger
language plpgsql
as $$
declare
  v_lifecycle_status public.proposal_lifecycle_enum;
  v_proposal_campus_id uuid;
  v_designation_title text;
  v_designation_campus_id uuid;
begin
  select p.lifecycle_status, p.campus_id
  into v_lifecycle_status, v_proposal_campus_id
  from public.faculty_load_proposal p
  where p.id = new.faculty_load_proposal_id;

  if v_lifecycle_status is null then
    raise exception 'Proposal does not exist.';
  end if;

  if v_lifecycle_status <> 'ACTIVE' then
    raise exception 'Only active proposals can be evaluated.';
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

  if v_designation_title <> 'Campus Director' then
    raise exception 'Only a Campus Director can evaluate an individual proposal.';
  end if;

  if v_designation_campus_id is distinct from v_proposal_campus_id then
    raise exception 'Campus Director campus does not match proposal campus.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_faculty_load_evaluation
on public.faculty_load_evaluation;

create trigger validate_faculty_load_evaluation
before insert on public.faculty_load_evaluation
for each row execute function public.trg_validate_faculty_load_evaluation();

create or replace function public.trg_apply_faculty_load_evaluation()
returns trigger
language plpgsql
as $$
begin
  update public.faculty_load_proposal
  set lifecycle_status = case
        when new.status = 'APPROVED'
          then 'APPROVED'::public.proposal_lifecycle_enum
        else 'REJECTED'::public.proposal_lifecycle_enum
      end,
      invalidated_reason = null,
      updated_at = now()
  where id = new.faculty_load_proposal_id;

  return null;
end;
$$;

drop trigger if exists apply_faculty_load_evaluation
on public.faculty_load_evaluation;

create trigger apply_faculty_load_evaluation
after insert on public.faculty_load_evaluation
for each row execute function public.trg_apply_faculty_load_evaluation();

create or replace function public.trg_validate_campus_load_evaluation()
returns trigger
language plpgsql
as $$
declare
  v_lifecycle_status public.proposal_lifecycle_enum;
  v_has_dfi_approval boolean;
  v_designation_title text;
begin
  select cp.lifecycle_status
  into v_lifecycle_status
  from public.campus_load cp
  where cp.id = new.campus_load_id;

  if v_lifecycle_status is null then
    raise exception 'Campus proposal does not exist.';
  end if;

  if v_lifecycle_status <> 'ACTIVE' then
    raise exception 'Only active campus proposals can be evaluated.';
  end if;

  if new.evaluator_user_id is null then
    raise exception 'Evaluator user is required.';
  end if;

  if new.designation_id is null then
    raise exception 'Evaluator designation is required.';
  end if;

  select d.job_title::text
  into v_designation_title
  from public.designation d
  where d.id = new.designation_id;

  if v_designation_title is null then
    raise exception 'Evaluator designation does not exist.';
  end if;

  if new.step = 'DIRECTOR_FOR_INSTRUCTION'
     and v_designation_title <> 'Director for Instruction' then
    raise exception 'Step DIRECTOR_FOR_INSTRUCTION requires Director for Instruction designation.';
  end if;

  if new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
     and v_designation_title <> 'Vice President for Academic Affairs' then
    raise exception 'Step VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS requires VPAA designation.';
  end if;

  if new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS' then
    select exists (
      select 1
      from public.campus_load_evaluation cpe
      where cpe.campus_load_id = new.campus_load_id
        and cpe.step = 'DIRECTOR_FOR_INSTRUCTION'
        and cpe.status = 'APPROVED'
    ) into v_has_dfi_approval;

    if not v_has_dfi_approval then
      raise exception 'Director for Instruction approval is required first.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_campus_load_evaluation
on public.campus_load_evaluation;

create trigger validate_campus_load_evaluation
before insert on public.campus_load_evaluation
for each row execute function public.trg_validate_campus_load_evaluation();

create or replace function public.trg_apply_campus_load_evaluation()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'REJECTED' then
    update public.campus_load
    set lifecycle_status = 'REJECTED',
        invalidated_reason = null,
        updated_at = now()
    where id = new.campus_load_id;
    return null;
  end if;

  if new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
     and new.status = 'APPROVED' then
    update public.campus_load
    set lifecycle_status = 'APPROVED',
        invalidated_reason = null,
        updated_at = now()
    where id = new.campus_load_id;
    return null;
  end if;

  update public.campus_load
  set updated_at = now()
  where id = new.campus_load_id;

  return null;
end;
$$;

drop trigger if exists apply_campus_load_evaluation
on public.campus_load_evaluation;

create trigger apply_campus_load_evaluation
after insert on public.campus_load_evaluation
for each row execute function public.trg_apply_campus_load_evaluation();
