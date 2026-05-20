-- =========================================================
-- AMENDMENT: Campus-college load schedule invalidation
-- Description:
--   Automatically returns submitted campus-college loads when source
--   scheduling data changes after a frozen revision has been submitted.
-- =========================================================

alter table public.campus_college_load_evaluation
  add column if not exists system_generated boolean not null default false;

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

  with affected as (
    select
      load.id as load_id,
      load.current_step,
      revision.id as revision_id
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
      and load.status = 'SUBMITTED'
      and load.current_step in (
        'CAMPUS_DIRECTOR',
        'DIRECTOR_FOR_INSTRUCTION',
        'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
      )
  ),
  inserted as (
    insert into public.campus_college_load_evaluation (
      campus_college_load_revision_id,
      step,
      status,
      comment,
      system_generated
    )
    select
      affected.revision_id,
      affected.current_step::text::public.campus_college_load_evaluation_step_enum,
      'RETURNED'::public.campus_college_load_evaluation_status_enum,
      p_reason,
      true
    from affected
    on conflict on constraint campus_college_load_evaluation_step_unique
    do nothing
    returning campus_college_load_revision_id
  )
  update public.campus_college_load load
  set status = 'RETURNED',
      current_step = 'PROGRAM_CHAIR',
      updated_by_user_id = null,
      updated_by_designation_id = null,
      updated_at = now()
  where exists (
    select 1
    from affected
    where affected.load_id = load.id
  );
end;
$$;

create or replace function public.invalidate_submitted_campus_college_loads_for_section(
  p_section_id uuid,
  p_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_scope record;
begin
  for v_scope in
    select distinct
      po.campus_id,
      program.college_id,
      section.academic_term_id
    from public.section section
    join public.major_offering mo on mo.id = section.major_offering_id
    join public.program_offering po on po.id = mo.program_offering_id
    join public.program program on program.id = po.program_id
    where section.id = p_section_id
  loop
    perform public.invalidate_submitted_campus_college_loads_for_scope(
      v_scope.campus_id,
      v_scope.college_id,
      v_scope.academic_term_id,
      coalesce(
        p_reason,
        'Returned automatically because source schedule data changed after submission. Please review the latest schedule and resubmit the campus-college load.'
      )
    );
  end loop;
end;
$$;

create or replace function public.invalidate_submitted_campus_college_loads_for_class(
  p_class_id uuid,
  p_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_section_id uuid;
begin
  for v_section_id in
    select distinct section_id
    from public.course_utilization
    where class_id = p_class_id
  loop
    perform public.invalidate_submitted_campus_college_loads_for_section(
      v_section_id,
      p_reason
    );
  end loop;
end;
$$;

create or replace function public.invalidate_submitted_campus_college_loads_for_course(
  p_course_id uuid,
  p_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_section_id uuid;
begin
  for v_section_id in
    select distinct section_id
    from public.course_utilization
    where course_id = p_course_id
  loop
    perform public.invalidate_submitted_campus_college_loads_for_section(
      v_section_id,
      p_reason
    );
  end loop;
end;
$$;

create or replace function public.invalidate_submitted_campus_college_loads_for_session(
  p_session_id uuid,
  p_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_class_id uuid;
begin
  for v_class_id in
    select distinct class_id
    from public.session_class
    where session_id = p_session_id
  loop
    perform public.invalidate_submitted_campus_college_loads_for_class(
      v_class_id,
      p_reason
    );
  end loop;
end;
$$;

create or replace function public.trg_invalidate_campus_college_load_from_course_utilization()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because course utilization changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.invalidate_submitted_campus_college_loads_for_section(old.section_id, v_reason);
    perform public.invalidate_submitted_campus_college_loads_for_class(old.class_id, v_reason);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.invalidate_submitted_campus_college_loads_for_section(new.section_id, v_reason);
    perform public.invalidate_submitted_campus_college_loads_for_class(new.class_id, v_reason);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_course_utilization
on public.course_utilization;

create trigger invalidate_campus_college_load_course_utilization
after insert or update or delete on public.course_utilization
for each row execute function public.trg_invalidate_campus_college_load_from_course_utilization();

create or replace function public.trg_invalidate_campus_college_load_from_user_class()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because a faculty class assignment changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.invalidate_submitted_campus_college_loads_for_class(old.class_id, v_reason);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.invalidate_submitted_campus_college_loads_for_class(new.class_id, v_reason);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_user_class
on public.user_class;

create trigger invalidate_campus_college_load_user_class
after insert or update or delete on public.user_class
for each row execute function public.trg_invalidate_campus_college_load_from_user_class();

create or replace function public.trg_invalidate_campus_college_load_from_session_class()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because a class schedule link changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.invalidate_submitted_campus_college_loads_for_class(old.class_id, v_reason);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.invalidate_submitted_campus_college_loads_for_class(new.class_id, v_reason);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_session_class
on public.session_class;

create trigger invalidate_campus_college_load_session_class
after insert or update or delete on public.session_class
for each row execute function public.trg_invalidate_campus_college_load_from_session_class();

create or replace function public.trg_invalidate_campus_college_load_from_session()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because a class session changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  perform public.invalidate_submitted_campus_college_loads_for_session(old.id, v_reason);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_session
on public.session;

create trigger invalidate_campus_college_load_session
before update or delete on public.session
for each row execute function public.trg_invalidate_campus_college_load_from_session();

create or replace function public.trg_invalidate_campus_college_load_from_section()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because section data changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  perform public.invalidate_submitted_campus_college_loads_for_section(old.id, v_reason);

  if tg_op = 'UPDATE' then
    perform public.invalidate_submitted_campus_college_loads_for_section(new.id, v_reason);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_section
on public.section;

create trigger invalidate_campus_college_load_section
before update or delete on public.section
for each row execute function public.trg_invalidate_campus_college_load_from_section();

create or replace function public.trg_invalidate_campus_college_load_from_class()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because class data changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  perform public.invalidate_submitted_campus_college_loads_for_class(old.id, v_reason);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_class
on public.class;

create trigger invalidate_campus_college_load_class
before update or delete on public.class
for each row execute function public.trg_invalidate_campus_college_load_from_class();

create or replace function public.trg_invalidate_campus_college_load_from_course()
returns trigger
language plpgsql
as $$
declare
  v_reason text := 'Returned automatically because course data changed after submission. Please review the latest schedule and resubmit the campus-college load.';
begin
  perform public.invalidate_submitted_campus_college_loads_for_course(old.id, v_reason);

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists invalidate_campus_college_load_course
on public.course;

create trigger invalidate_campus_college_load_course
before update or delete on public.course
for each row execute function public.trg_invalidate_campus_college_load_from_course();
