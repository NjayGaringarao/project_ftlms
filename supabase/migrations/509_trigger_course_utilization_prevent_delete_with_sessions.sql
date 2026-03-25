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
-- Proposal invalidation workflow
-- =========================================================

create or replace function public.invalidate_proposals_for_user(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  update public.proposal
  set is_valid = false
  where user_id = p_user_id
    and is_valid = true;
end;
$$;

create or replace function public.invalidate_proposals_for_user_term(
  p_user_id uuid,
  p_academic_term_id uuid
)
returns void
language plpgsql
as $$
begin
  update public.proposal
  set is_valid = false
  where user_id = p_user_id
    and academic_term_id = p_academic_term_id
    and is_valid = true;
end;
$$;

create or replace function public.invalidate_proposals_for_user_class(
  p_user_id uuid,
  p_class_id uuid
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
    perform public.invalidate_proposals_for_user_term(p_user_id, v_term_id);
  end if;
end;
$$;

create or replace function public.trg_invalidate_proposals_on_designation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.invalidate_proposals_for_user(old.user_id);
  elsif tg_op = 'UPDATE' then
    perform public.invalidate_proposals_for_user(new.user_id);
    if old.user_id is distinct from new.user_id then
      perform public.invalidate_proposals_for_user(old.user_id);
    end if;
  else
    perform public.invalidate_proposals_for_user(new.user_id);
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
    perform public.invalidate_proposals_for_user_class(old.user_id, old.class_id);
  elsif tg_op = 'UPDATE' then
    perform public.invalidate_proposals_for_user_class(old.user_id, old.class_id);
    perform public.invalidate_proposals_for_user_class(new.user_id, new.class_id);
  else
    perform public.invalidate_proposals_for_user_class(new.user_id, new.class_id);
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
    set is_valid = false
    where p.is_valid = true
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
    set is_valid = false
    where p.is_valid = true
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
    set is_valid = false
    where p.is_valid = true
      and exists (
        select 1
        from public.user_class uc
        join public.block b on b.id = old.block_id
        where uc.class_id = old.class_id
          and uc.user_id = p.user_id
          and b.academic_term_id = p.academic_term_id
      );
    update public.proposal p
    set is_valid = false
    where p.is_valid = true
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
    set is_valid = false
    where p.is_valid = true
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
