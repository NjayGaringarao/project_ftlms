-- =========================================================
-- TRIGGERS: Proposal invalidation helpers and propagation
-- =========================================================

create or replace function public.invalidate_current_campus_loads(
  p_campus_id uuid,
  p_academic_term_id uuid,
  p_reason text default 'INDIVIDUAL_PROPOSAL_CHANGED'
)
returns void
language plpgsql
as $$
begin
  update public.campus_load
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
  update public.faculty_load_proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'FACULTY_ASSIGNMENT_CHANGED'),
      updated_at = now()
  where user_id = p_user_id
    and lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED');
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
  update public.faculty_load_proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'FACULTY_ASSIGNMENT_CHANGED'),
      updated_at = now()
  where user_id = p_user_id
    and academic_term_id = p_academic_term_id
    and lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED');
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
  join public.section b on b.id = cu.section_id
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
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UNIT_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
      and exists (
        select 1
        from public.user_class uc
        join public.course_utilization cu on cu.class_id = uc.class_id
        join public.section b on b.id = cu.section_id
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
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
      and exists (
        select 1
        from public.user_class uc
        join public.section b on b.id = old.section_id
        where uc.class_id = old.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  elsif tg_op = 'UPDATE' then
    if old.section_id is not distinct from new.section_id
       and old.course_id is not distinct from new.course_id
       and old.class_id is not distinct from new.class_id then
      return null;
    end if;
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
      and exists (
        select 1
        from public.user_class uc
        join public.section b on b.id = old.section_id
        where uc.class_id = old.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
      and exists (
        select 1
        from public.user_class uc
        join public.section b on b.id = new.section_id
        where uc.class_id = new.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
  else
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'COURSE_UTILIZATION_CHANGED',
        updated_at = now()
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
      and exists (
        select 1
        from public.user_class uc
        join public.section b on b.id = new.section_id
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

create or replace function public.trg_invalidate_campus_load_on_faculty_load_proposal_change()
returns trigger
language plpgsql
as $$
declare
  v_scope_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.lifecycle_status = 'ACTIVE' then
      perform public.invalidate_current_campus_loads(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_CREATED'
      );
    end if;
    return null;
  end if;

  if tg_op = 'DELETE' then
    perform public.invalidate_current_campus_loads(
      old.campus_id,
      old.academic_term_id,
      'INDIVIDUAL_PROPOSAL_DELETED'
    );
    return null;
  end if;

  v_scope_changed :=
    old.campus_id is distinct from new.campus_id
    or old.academic_term_id is distinct from new.academic_term_id;

  if v_scope_changed then
    perform public.invalidate_current_campus_loads(
      old.campus_id,
      old.academic_term_id,
      'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED'
    );
    perform public.invalidate_current_campus_loads(
      new.campus_id,
      new.academic_term_id,
      'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED'
    );
    return null;
  end if;

  if new.lifecycle_status is distinct from old.lifecycle_status then
    if new.lifecycle_status = 'INVALIDATED' then
      perform public.invalidate_current_campus_loads(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_INVALIDATED'
      );
    elsif new.lifecycle_status = 'REJECTED' then
      perform public.invalidate_current_campus_loads(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_REJECTED'
      );
    elsif new.lifecycle_status = 'ACTIVE' then
      perform public.invalidate_current_campus_loads(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_CREATED'
      );
    end if;
  end if;

  return null;
end;
$$;

comment on function public.trg_invalidate_campus_load_on_faculty_load_proposal_change()
is 'Canonical owner (515): invalidates current campus proposals when scoped individual proposal lifecycle/scope changes occur.';

drop trigger if exists invalidate_campus_load_on_faculty_load_proposal_change
on public.faculty_load_proposal;

create trigger invalidate_campus_load_on_faculty_load_proposal_change
after insert or delete or update of lifecycle_status, campus_id, academic_term_id
on public.faculty_load_proposal
for each row execute function public.trg_invalidate_campus_load_on_faculty_load_proposal_change();
