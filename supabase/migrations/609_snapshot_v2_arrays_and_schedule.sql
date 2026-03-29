-- =========================================================
-- SNAPSHOT V2: ARRAY-BASED DEGREE/DESIGNATION + RAW SCHEDULE SESSIONS
-- =========================================================

-- faculty_load_proposal: convert text snapshot fields to jsonb arrays
alter table public.faculty_load_proposal
  alter column bachelors_degree type jsonb
    using case
      when coalesce(btrim(bachelors_degree), '') = '' then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object(
          'title', btrim(bachelors_degree),
          'year_graduated', null
        )
      )
    end,
  alter column masters_degree type jsonb
    using case
      when coalesce(btrim(masters_degree), '') = '' then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object(
          'title', btrim(masters_degree),
          'year_graduated', null
        )
      )
    end,
  alter column doctorate_degree type jsonb
    using case
      when coalesce(btrim(doctorate_degree), '') = '' then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object(
          'title', btrim(doctorate_degree),
          'year_graduated', null
        )
      )
    end,
  alter column designations type jsonb
    using case
      when coalesce(btrim(designations), '') = '' then '[]'::jsonb
      else jsonb_build_array(
        jsonb_build_object(
          'job_title', btrim(designations),
          'campus_code', null,
          'college_code', null,
          'program_offering_code', null
        )
      )
    end;

alter table public.faculty_load_proposal
  alter column bachelors_degree set default '[]'::jsonb,
  alter column masters_degree set default '[]'::jsonb,
  alter column doctorate_degree set default '[]'::jsonb,
  alter column designations set default '[]'::jsonb;

update public.faculty_load_proposal
set
  bachelors_degree = coalesce(bachelors_degree, '[]'::jsonb),
  masters_degree = coalesce(masters_degree, '[]'::jsonb),
  doctorate_degree = coalesce(doctorate_degree, '[]'::jsonb),
  designations = coalesce(designations, '[]'::jsonb);

alter table public.faculty_load_proposal
  alter column bachelors_degree set not null,
  alter column masters_degree set not null,
  alter column doctorate_degree set not null,
  alter column designations set not null;

alter table public.faculty_load_proposal
  add column if not exists schedule_sessions jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'faculty_load_proposal_snapshot_arrays_check'
  ) then
    alter table public.faculty_load_proposal
      add constraint faculty_load_proposal_snapshot_arrays_check
      check (
        jsonb_typeof(bachelors_degree) = 'array'
        and jsonb_typeof(masters_degree) = 'array'
        and jsonb_typeof(doctorate_degree) = 'array'
        and jsonb_typeof(designations) = 'array'
        and jsonb_typeof(schedule_sessions) = 'array'
      );
  end if;
end
$$;

-- campus_load_member: normalize as pure join table
alter table public.campus_load_member
  drop column if exists faculty_user_id,
  drop column if exists employment_status,
  drop column if exists academic_rank,
  drop column if exists bachelors_degree,
  drop column if exists masters_degree,
  drop column if exists doctorate_degree,
  drop column if exists designations,
  drop column if exists schedule_sessions,
  drop column if exists equivalent_teaching_load,
  drop column if exists total_lecture_hours,
  drop column if exists total_lab_hours,
  drop column if exists preparation_count,
  drop column if exists actual_teaching_load,
  drop column if exists advisory_class,
  drop column if exists source_faculty_load_proposal_lifecycle_status,
  drop column if exists source_faculty_load_proposal_created_at;

alter table public.campus_load_member
  alter column campus_load_id set not null,
  alter column source_faculty_load_proposal_id set not null;

create or replace function public.create_faculty_load_proposal(
  p_user_id uuid,
  p_campus_id uuid,
  p_academic_term_id uuid,
  p_employment_status public.employment_status_enum,
  p_academic_rank text default null,
  p_bachelors_degree jsonb default '[]'::jsonb,
  p_masters_degree jsonb default '[]'::jsonb,
  p_doctorate_degree jsonb default '[]'::jsonb,
  p_designations jsonb default '[]'::jsonb,
  p_schedule_sessions jsonb default '[]'::jsonb,
  p_equivalent_teaching_load numeric default null,
  p_total_lecture_hours numeric default null,
  p_total_lab_hours numeric default null,
  p_preparation_count integer default null,
  p_actual_teaching_load numeric default null,
  p_advisory_class text default null,
  p_created_by_user_id uuid default null,
  p_created_by_designation_id uuid default null,
  p_require_latest_no_or_invalidated boolean default false,
  p_invalidate_current_active_approved boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_latest_status public.proposal_lifecycle_enum;
  v_inserted_faculty_load_proposal_id uuid;
begin
  select p.lifecycle_status
  into v_latest_status
  from public.faculty_load_proposal p
  where p.user_id = p_user_id
    and p.academic_term_id = p_academic_term_id
  order by p.created_at desc
  limit 1;

  if p_require_latest_no_or_invalidated
     and v_latest_status is not null
     and v_latest_status <> 'INVALIDATED' then
    return jsonb_build_object(
      'success', false,
      'faculty_load_proposal_id', null,
      'campus_id', p_campus_id,
      'reason', 'INELIGIBLE_LATEST_STATUS'
    );
  end if;

  if p_require_latest_no_or_invalidated and exists (
    select 1
    from public.faculty_load_proposal p
    where p.user_id = p_user_id
      and p.academic_term_id = p_academic_term_id
      and p.lifecycle_status in ('ACTIVE', 'APPROVED')
  ) then
    return jsonb_build_object(
      'success', false,
      'faculty_load_proposal_id', null,
      'campus_id', p_campus_id,
      'reason', 'CURRENT_PROPOSAL_EXISTS'
    );
  end if;

  if p_invalidate_current_active_approved then
    update public.faculty_load_proposal p
    set lifecycle_status = 'INVALIDATED',
        invalidated_reason = 'RECREATED_BY_NEW_PROPOSAL',
        updated_at = now()
    where p.user_id = p_user_id
      and p.academic_term_id = p_academic_term_id
      and p.lifecycle_status in ('ACTIVE', 'APPROVED');
  end if;

  if exists (
    select 1
    from public.faculty_load_proposal p
    where p.user_id = p_user_id
      and p.academic_term_id = p_academic_term_id
      and p.lifecycle_status in ('ACTIVE', 'APPROVED')
  ) then
    return jsonb_build_object(
      'success', false,
      'faculty_load_proposal_id', null,
      'campus_id', p_campus_id,
      'reason', 'CURRENT_PROPOSAL_EXISTS'
    );
  end if;

  insert into public.faculty_load_proposal (
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    academic_rank,
    bachelors_degree,
    masters_degree,
    doctorate_degree,
    designations,
    schedule_sessions,
    equivalent_teaching_load,
    total_lecture_hours,
    total_lab_hours,
    preparation_count,
    actual_teaching_load,
    advisory_class,
    lifecycle_status,
    invalidated_reason,
    created_by_user_id,
    created_by_designation_id
  ) values (
    p_user_id,
    p_campus_id,
    p_academic_term_id,
    p_employment_status,
    p_academic_rank,
    coalesce(p_bachelors_degree, '[]'::jsonb),
    coalesce(p_masters_degree, '[]'::jsonb),
    coalesce(p_doctorate_degree, '[]'::jsonb),
    coalesce(p_designations, '[]'::jsonb),
    coalesce(p_schedule_sessions, '[]'::jsonb),
    p_equivalent_teaching_load,
    p_total_lecture_hours,
    p_total_lab_hours,
    p_preparation_count,
    p_actual_teaching_load,
    p_advisory_class,
    'ACTIVE',
    null,
    p_created_by_user_id,
    p_created_by_designation_id
  )
  returning id into v_inserted_faculty_load_proposal_id;

  update public.campus_load cp
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = 'INDIVIDUAL_PROPOSAL_CREATED',
      updated_at = now()
  where cp.campus_id = p_campus_id
    and cp.academic_term_id = p_academic_term_id
    and cp.lifecycle_status in ('ACTIVE', 'APPROVED');

  return jsonb_build_object(
    'success', true,
    'faculty_load_proposal_id', v_inserted_faculty_load_proposal_id,
    'campus_id', p_campus_id,
    'reason', null
  );
end;
$$;

create or replace function public.create_campus_load_proposal(
  p_campus_id uuid,
  p_academic_term_id uuid,
  p_created_by_user_id uuid,
  p_created_by_designation_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_has_active boolean;
  v_approved_count integer;
  v_campus_load_id uuid;
begin
  select exists (
    select 1
    from public.faculty_load_proposal p
    where p.campus_id = p_campus_id
      and p.academic_term_id = p_academic_term_id
      and p.lifecycle_status = 'ACTIVE'
  ) into v_has_active;

  if v_has_active then
    return jsonb_build_object(
      'success', false,
      'campus_load_id', null,
      'campus_id', p_campus_id,
      'reason', 'HAS_ACTIVE_INDIVIDUALS'
    );
  end if;

  select count(*)
  into v_approved_count
  from public.faculty_load_proposal p
  where p.campus_id = p_campus_id
    and p.academic_term_id = p_academic_term_id
    and p.lifecycle_status = 'APPROVED';

  if coalesce(v_approved_count, 0) = 0 then
    return jsonb_build_object(
      'success', false,
      'campus_load_id', null,
      'campus_id', p_campus_id,
      'reason', 'NO_APPROVED_INDIVIDUALS'
    );
  end if;

  update public.campus_load cp
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = 'RECREATED_BY_CAMPUS_DIRECTOR',
      updated_at = now()
  where cp.campus_id = p_campus_id
    and cp.academic_term_id = p_academic_term_id
    and cp.lifecycle_status in ('ACTIVE', 'APPROVED');

  insert into public.campus_load (
    campus_id,
    academic_term_id,
    lifecycle_status,
    invalidated_reason,
    created_by_user_id,
    created_by_designation_id
  ) values (
    p_campus_id,
    p_academic_term_id,
    'ACTIVE',
    null,
    p_created_by_user_id,
    p_created_by_designation_id
  )
  returning id into v_campus_load_id;

  insert into public.campus_load_member (
    campus_load_id,
    source_faculty_load_proposal_id
  )
  select
    v_campus_load_id,
    p.id
  from public.faculty_load_proposal p
  where p.campus_id = p_campus_id
    and p.academic_term_id = p_academic_term_id
    and p.lifecycle_status = 'APPROVED';

  return jsonb_build_object(
    'success', true,
    'campus_load_id', v_campus_load_id,
    'campus_id', p_campus_id,
    'reason', null
  );
end;
$$;
