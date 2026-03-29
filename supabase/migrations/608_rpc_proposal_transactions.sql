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

create or replace function public.claim_document_export_job(
  p_job_id uuid,
  p_requester_user_id uuid,
  p_lock_seconds integer default 120
)
returns public.document_export_job
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claimed public.document_export_job;
begin
  update public.document_export_job job
  set
    status = 'PROCESSING',
    started_at = coalesce(job.started_at, now()),
    lock_token = gen_random_uuid(),
    lock_expires_at = now() + make_interval(secs => greatest(coalesce(p_lock_seconds, 120), 30))
  where job.id = p_job_id
    and job.requester_user_id = p_requester_user_id
    and job.status in ('QUEUED', 'PROCESSING')
    and (job.lock_expires_at is null or job.lock_expires_at < now())
  returning job.* into v_claimed;

  return v_claimed;
end;
$$;

grant execute on function public.claim_document_export_job(uuid, uuid, integer) to authenticated;
