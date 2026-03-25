do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'proposal_current_user_term_unique'
  ) then
    create unique index proposal_current_user_term_unique
      on public.proposal (user_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'campus_proposal_current_campus_term_unique'
  ) then
    create unique index campus_proposal_current_campus_term_unique
      on public.campus_proposal (campus_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_proposal_member_source_unique'
      and conrelid = 'public.campus_proposal_member'::regclass
  ) then
    alter table public.campus_proposal_member
      add constraint campus_proposal_member_source_unique
      unique (campus_proposal_id, source_proposal_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'individual_proposal_evaluation_step_unique'
      and conrelid = 'public.individual_proposal_evaluation'::regclass
  ) then
    alter table public.individual_proposal_evaluation
      add constraint individual_proposal_evaluation_step_unique
      unique (proposal_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_proposal_evaluation_step_unique'
      and conrelid = 'public.campus_proposal_evaluation'::regclass
  ) then
    alter table public.campus_proposal_evaluation
      add constraint campus_proposal_evaluation_step_unique
      unique (campus_proposal_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'individual_proposal_evaluation_status_final'
      and conrelid = 'public.individual_proposal_evaluation'::regclass
  ) then
    alter table public.individual_proposal_evaluation
      add constraint individual_proposal_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_proposal_evaluation_status_final'
      and conrelid = 'public.campus_proposal_evaluation'::regclass
  ) then
    alter table public.campus_proposal_evaluation
      add constraint campus_proposal_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;
end;
$$;
