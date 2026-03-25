-- Prevent deleting course_utilization when its class has sessions

create or replace function public.prevent_course_utilization_delete_with_sessions()
returns trigger
language plpgsql
as $$
begin
  if old.class_id is null then
    return old;
  end if;

  if exists (
    select 1
    from public.session_class sc
    where sc.class_id = old.class_id
    limit 1
  ) then
    raise exception 'Cannot delete course utilization: class has scheduled sessions';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_course_utilization_with_sessions on public.course_utilization;
create trigger trg_prevent_delete_course_utilization_with_sessions
before delete on public.course_utilization
for each row
execute function public.prevent_course_utilization_delete_with_sessions();

-- =========================================================
-- Proposal invalidation helpers
-- =========================================================

create or replace function public.invalidate_current_campus_proposals(
  p_campus_id uuid,
  p_academic_term_id uuid,
  p_reason text default 'INDIVIDUAL_PROPOSAL_CHANGED'
)
returns void
language plpgsql
as $$
begin
  update public.campus_proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'INDIVIDUAL_PROPOSAL_CHANGED'),
      updated_at = now()
  where campus_id = p_campus_id
    and academic_term_id = p_academic_term_id
    and lifecycle_status in ('ACTIVE', 'APPROVED');
end;
$$;

create or replace function public.invalidate_current_proposals_for_user(
  p_user_id uuid,
  p_reason text default 'FACULTY_ASSIGNMENT_CHANGED'
)
returns void
language plpgsql
as $$
begin
  update public.proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'FACULTY_ASSIGNMENT_CHANGED'),
      updated_at = now()
  where user_id = p_user_id
    and lifecycle_status in ('ACTIVE', 'APPROVED');
end;
$$;

create or replace function public.invalidate_current_proposals_for_user_term(
  p_user_id uuid,
  p_academic_term_id uuid,
  p_reason text default 'FACULTY_ASSIGNMENT_CHANGED'
)
returns void
language plpgsql
as $$
begin
  update public.proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'FACULTY_ASSIGNMENT_CHANGED'),
      updated_at = now()
  where user_id = p_user_id
    and academic_term_id = p_academic_term_id
    and lifecycle_status in ('ACTIVE', 'APPROVED');
end;
$$;

create or replace function public.invalidate_current_proposals_for_user_class(
  p_user_id uuid,
  p_class_id uuid,
  p_reason text default 'FACULTY_ASSIGNMENT_CHANGED'
)
returns void
language plpgsql
as $$
declare
  v_term_id uuid;
begin
  select b.academic_term_id
  into v_term_id
  from public.course_utilization cu
  join public.block b on b.id = cu.block_id
  where cu.class_id = p_class_id
  limit 1;

  if v_term_id is not null then
    perform public.invalidate_current_proposals_for_user_term(
      p_user_id,
      v_term_id,
      p_reason
    );
  end if;
end;
$$;

-- =========================================================
-- Proposal invalidation triggers
-- =========================================================

create or replace function public.trg_invalidate_proposals_on_designation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.invalidate_current_proposals_for_user(
      old.user_id,
      'DESIGNATION_CHANGED'
    );
  elsif tg_op = 'UPDATE' then
    perform public.invalidate_current_proposals_for_user(
      new.user_id,
      'DESIGNATION_CHANGED'
    );
    if old.user_id is distinct from new.user_id then
      perform public.invalidate_current_proposals_for_user(
        old.user_id,
        'DESIGNATION_CHANGED'
      );
    end if;
  else
    perform public.invalidate_current_proposals_for_user(
      new.user_id,
      'DESIGNATION_CHANGED'
    );
  end if;
  return null;
end;
$$;

drop trigger if exists invalidate_proposals_on_designation
on public.designation;

create trigger invalidate_proposals_on_designation
after insert or update or delete on public.designation
for each row execute function public.trg_invalidate_proposals_on_designation();

create or replace function public.trg_invalidate_proposals_on_user_class()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.invalidate_current_proposals_for_user_class(
      old.user_id,
      old.class_id,
      'FACULTY_CLASS_CHANGED'
    );
  elsif tg_op = 'UPDATE' then
    perform public.invalidate_current_proposals_for_user_class(
      old.user_id,
      old.class_id,
      'FACULTY_CLASS_CHANGED'
    );
    perform public.invalidate_current_proposals_for_user_class(
      new.user_id,
      new.class_id,
      'FACULTY_CLASS_CHANGED'
    );
  else
    perform public.invalidate_current_proposals_for_user_class(
      new.user_id,
      new.class_id,
      'FACULTY_CLASS_CHANGED'
    );
  end if;
  return null;
end;
$$;

drop trigger if exists invalidate_proposals_on_user_class
on public.user_class;

create trigger invalidate_proposals_on_user_class
after insert or update or delete on public.user_class
for each row execute function public.trg_invalidate_proposals_on_user_class();

create or replace function public.trg_invalidate_proposals_on_course_units()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and (old.lecture_unit is distinct from new.lecture_unit
          or old.laboratory_unit is distinct from new.laboratory_unit) then
    update public.proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UNIT_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED')
      and exists (
        select 1
        from public.user_class uc
        join public.course_utilization cu on cu.class_id = uc.class_id
        join public.block b on b.id = cu.block_id
        where cu.course_id = new.id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  end if;
  return null;
end;
$$;

drop trigger if exists invalidate_proposals_on_course_units
on public.course;

create trigger invalidate_proposals_on_course_units
after update on public.course
for each row execute function public.trg_invalidate_proposals_on_course_units();

create or replace function public.trg_invalidate_proposals_on_course_utilization()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    update public.proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED')
      and exists (
        select 1
        from public.user_class uc
        join public.block b on b.id = old.block_id
        where uc.class_id = old.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  elsif tg_op = 'UPDATE' then
    if old.block_id is not distinct from new.block_id
       and old.course_id is not distinct from new.course_id
       and old.class_id is not distinct from new.class_id then
      return null;
    end if;
    update public.proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED')
      and exists (
        select 1
        from public.user_class uc
        join public.block b on b.id = old.block_id
        where uc.class_id = old.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
    update public.proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED')
      and exists (
        select 1
        from public.user_class uc
        join public.block b on b.id = new.block_id
        where uc.class_id = new.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  else
    update public.proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED')
      and exists (
        select 1
        from public.user_class uc
        join public.block b on b.id = new.block_id
        where uc.class_id = new.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  end if;
  return null;
end;
$$;

drop trigger if exists invalidate_proposals_on_course_utilization
on public.course_utilization;

create trigger invalidate_proposals_on_course_utilization
after insert or update or delete on public.course_utilization
for each row execute function public.trg_invalidate_proposals_on_course_utilization();

create or replace function public.trg_invalidate_campus_proposal_on_proposal_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.lifecycle_status = 'ACTIVE' then
      perform public.invalidate_current_campus_proposals(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_CREATED'
      );
    end if;
    return null;
  end if;

  if new.lifecycle_status = 'INVALIDATED'
     and old.lifecycle_status is distinct from new.lifecycle_status then
    perform public.invalidate_current_campus_proposals(
      new.campus_id,
      new.academic_term_id,
      'INDIVIDUAL_PROPOSAL_INVALIDATED'
    );
  end if;

  return null;
end;
$$;

drop trigger if exists invalidate_campus_proposal_on_proposal_change
on public.proposal;

create trigger invalidate_campus_proposal_on_proposal_change
after insert or update of lifecycle_status on public.proposal
for each row execute function public.trg_invalidate_campus_proposal_on_proposal_change();

create or replace function public.trg_validate_campus_proposal_creation()
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

drop trigger if exists validate_campus_proposal_creation
on public.campus_proposal;

create trigger validate_campus_proposal_creation
before insert on public.campus_proposal
for each row execute function public.trg_validate_campus_proposal_creation();

create or replace function public.trg_validate_campus_proposal_member()
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
  from public.campus_proposal cp
  where cp.id = new.campus_proposal_id;

  if v_campus_id is null then
    raise exception 'Campus proposal does not exist.';
  end if;

  select p.campus_id, p.academic_term_id, p.lifecycle_status
  into v_source_campus_id, v_source_term_id, v_source_status
  from public.proposal p
  where p.id = new.source_proposal_id;

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

drop trigger if exists validate_campus_proposal_member
on public.campus_proposal_member;

create trigger validate_campus_proposal_member
before insert on public.campus_proposal_member
for each row execute function public.trg_validate_campus_proposal_member();

-- =========================================================
-- Evaluation workflow sequencing and lifecycle transitions
-- =========================================================

create or replace function public.trg_validate_individual_proposal_evaluation()
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
  from public.proposal p
  where p.id = new.proposal_id;

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

drop trigger if exists validate_individual_proposal_evaluation
on public.individual_proposal_evaluation;

create trigger validate_individual_proposal_evaluation
before insert on public.individual_proposal_evaluation
for each row execute function public.trg_validate_individual_proposal_evaluation();

create or replace function public.trg_apply_individual_proposal_evaluation()
returns trigger
language plpgsql
as $$
begin
  update public.proposal
  set lifecycle_status = case
        when new.status = 'APPROVED' then 'APPROVED'
        else 'REJECTED'
      end,
      invalidated_reason = null,
      updated_at = now()
  where id = new.proposal_id;

  return null;
end;
$$;

drop trigger if exists apply_individual_proposal_evaluation
on public.individual_proposal_evaluation;

create trigger apply_individual_proposal_evaluation
after insert on public.individual_proposal_evaluation
for each row execute function public.trg_apply_individual_proposal_evaluation();

create or replace function public.trg_validate_campus_proposal_evaluation()
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
  from public.campus_proposal cp
  where cp.id = new.campus_proposal_id;

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
      from public.campus_proposal_evaluation cpe
      where cpe.campus_proposal_id = new.campus_proposal_id
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

drop trigger if exists validate_campus_proposal_evaluation
on public.campus_proposal_evaluation;

create trigger validate_campus_proposal_evaluation
before insert on public.campus_proposal_evaluation
for each row execute function public.trg_validate_campus_proposal_evaluation();

create or replace function public.trg_apply_campus_proposal_evaluation()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'REJECTED' then
    update public.campus_proposal
    set lifecycle_status = 'REJECTED',
        invalidated_reason = null,
        updated_at = now()
    where id = new.campus_proposal_id;
    return null;
  end if;

  if new.step = 'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
     and new.status = 'APPROVED' then
    update public.campus_proposal
    set lifecycle_status = 'APPROVED',
        invalidated_reason = null,
        updated_at = now()
    where id = new.campus_proposal_id;
    return null;
  end if;

  update public.campus_proposal
  set updated_at = now()
  where id = new.campus_proposal_id;

  return null;
end;
$$;

drop trigger if exists apply_campus_proposal_evaluation
on public.campus_proposal_evaluation;

create trigger apply_campus_proposal_evaluation
after insert on public.campus_proposal_evaluation
for each row execute function public.trg_apply_campus_proposal_evaluation();
