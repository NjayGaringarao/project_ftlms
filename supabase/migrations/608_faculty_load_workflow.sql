-- =========================================================
-- FACULTY LOAD WORKFLOW: Evaluation metadata + proposal invalidation
-- =========================================================

-- Rename evaluation metadata table
alter table if exists public.evaluation_mt
  rename to evaluation_metadata;

-- Update evaluation table structure
alter table if exists public.evaluation
  drop column if exists evaluator_role;

alter table if exists public.evaluation
  add column if not exists evaluation_metadata_id uuid
    references public.evaluation_metadata(id) on delete cascade;

alter table if exists public.evaluation
  add column if not exists evaluator_user_id uuid
    references public."user"(id) on delete set null;

-- Drop uniqueness constraint so evaluation history can be append-only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evaluation_designation_proposal_unique'
      AND conrelid = 'public.evaluation'::regclass
  ) THEN
    ALTER TABLE public.evaluation
      DROP CONSTRAINT evaluation_designation_proposal_unique;
  END IF;
END $$;

-- Seed evaluation metadata
INSERT INTO public.evaluation_metadata (evaluator_role, evaluation_level, campus_code)
SELECT 'Campus Director', 0, c.code
FROM public.campus c
WHERE NOT EXISTS (
  SELECT 1 FROM public.evaluation_metadata em
  WHERE em.evaluation_level = 0
    AND em.campus_code = c.code
);

INSERT INTO public.evaluation_metadata (evaluator_role, evaluation_level, campus_code)
SELECT 'Director for Instruction', 1, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.evaluation_metadata em
  WHERE em.evaluation_level = 1
    AND em.campus_code IS NULL
);

INSERT INTO public.evaluation_metadata (evaluator_role, evaluation_level, campus_code)
SELECT 'University President', 2, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM public.evaluation_metadata em
  WHERE em.evaluation_level = 2
    AND em.campus_code IS NULL
);

-- Proposal invalidation helpers
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

-- Invalidate when designation changes
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

DROP TRIGGER IF EXISTS invalidate_proposals_on_designation
ON public.designation;

create trigger invalidate_proposals_on_designation
after insert or update or delete on public.designation
for each row execute function public.trg_invalidate_proposals_on_designation();

-- Invalidate when user_class changes
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

DROP TRIGGER IF EXISTS invalidate_proposals_on_user_class
ON public.user_class;

create trigger invalidate_proposals_on_user_class
after insert or update or delete on public.user_class
for each row execute function public.trg_invalidate_proposals_on_user_class();

-- Invalidate when course unit values change
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

DROP TRIGGER IF EXISTS invalidate_proposals_on_course_units
ON public.course;

create trigger invalidate_proposals_on_course_units
after update on public.course
for each row execute function public.trg_invalidate_proposals_on_course_units();

-- Invalidate when course utilization changes
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

DROP TRIGGER IF EXISTS invalidate_proposals_on_course_utilization
ON public.course_utilization;

create trigger invalidate_proposals_on_course_utilization
after insert or update or delete on public.course_utilization
for each row execute function public.trg_invalidate_proposals_on_course_utilization();
