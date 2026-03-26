-- Include rejected individual proposals in load-change invalidation scope.
-- Rejected proposals should also become INVALIDATED when source load data changes.

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
  update public.proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = coalesce(p_reason, 'FACULTY_ASSIGNMENT_CHANGED'),
      updated_at = now()
  where user_id = p_user_id
    and academic_term_id = p_academic_term_id
    and lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED');
end;
$$;

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
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
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
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
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
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
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
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
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
    where p.lifecycle_status in ('ACTIVE', 'APPROVED', 'REJECTED')
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
