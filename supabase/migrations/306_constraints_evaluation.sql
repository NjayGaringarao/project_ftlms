do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'faculty_load_proposal_current_user_term_unique'
  ) then
    create unique index faculty_load_proposal_current_user_term_unique
      on public.faculty_load_proposal (user_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'campus_load_current_campus_term_unique'
  ) then
    create unique index campus_load_current_campus_term_unique
      on public.campus_load (campus_id, academic_term_id)
      where lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_member_source_unique'
      and conrelid = 'public.campus_load_member'::regclass
  ) then
    alter table public.campus_load_member
      add constraint campus_load_member_source_unique
      unique (campus_load_id, source_faculty_load_proposal_id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'faculty_load_evaluation_step_unique'
      and conrelid = 'public.faculty_load_evaluation'::regclass
  ) then
    alter table public.faculty_load_evaluation
      add constraint faculty_load_evaluation_step_unique
      unique (faculty_load_proposal_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_evaluation_step_unique'
      and conrelid = 'public.campus_load_evaluation'::regclass
  ) then
    alter table public.campus_load_evaluation
      add constraint campus_load_evaluation_step_unique
      unique (campus_load_id, step);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'faculty_load_evaluation_status_final'
      and conrelid = 'public.faculty_load_evaluation'::regclass
  ) then
    alter table public.faculty_load_evaluation
      add constraint faculty_load_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_load_evaluation_status_final'
      and conrelid = 'public.campus_load_evaluation'::regclass
  ) then
    alter table public.campus_load_evaluation
      add constraint campus_load_evaluation_status_final
      check (status in ('APPROVED', 'REJECTED'));
  end if;
end;
$$;
