-- Campus Proposal Invalidation Regression Harness
-- ------------------------------------------------
-- Purpose:
--   Validate that proposal-level lifecycle/scope changes invalidate only the
--   matching current campus proposal scope through trigger v617.
--
-- How to run (local dev):
--   npx supabase db reset
--   npx supabase db query --file supabase/tests/campus_proposal_invalidation_regression.sql
--
-- Notes:
--   - This script is self-contained and uses a transaction with ROLLBACK.
--   - It requires at least one row in public."user" (seeded/dev user).

begin;

do $$
declare
  v_user_id uuid;
  v_campus_a_id uuid := gen_random_uuid();
  v_campus_b_id uuid := gen_random_uuid();
  v_year_a_id uuid := gen_random_uuid();
  v_year_b_id uuid := gen_random_uuid();
  v_term_1_id uuid := gen_random_uuid();
  v_term_2_id uuid := gen_random_uuid();
  v_term_3_id uuid := gen_random_uuid();
  v_term_4_id uuid := gen_random_uuid();
  v_term_5_id uuid := gen_random_uuid();

  v_guard_campus_proposal_id uuid;
  v_case_1_campus_proposal_id uuid;
  v_case_2_campus_proposal_id uuid;
  v_case_3_campus_proposal_id uuid;
  v_case_4_campus_proposal_id uuid;
  v_case_5_old_scope_campus_proposal_id uuid;
  v_case_5_new_scope_campus_proposal_id uuid;

  v_case_1_proposal_id uuid;
  v_case_2_proposal_id uuid;
  v_case_3_proposal_id uuid;
  v_case_4_proposal_id uuid;
  v_case_5_proposal_id uuid;

  v_status public.proposal_lifecycle_enum;
  v_reason text;
begin
  select u.id
  into v_user_id
  from public."user" u
  order by u.id
  limit 1;

  if v_user_id is null then
    raise exception 'Harness requires at least one row in public."user".';
  end if;

  -- --------------------------------------------------------------
  -- Fixture scope (isolated campuses/years/terms inside tx)
  -- --------------------------------------------------------------
  insert into public.campus (id, code, name, address)
  values
    (v_campus_a_id, 'HRN-A-' || left(v_campus_a_id::text, 6), 'Harness Campus A ' || left(v_campus_a_id::text, 6), 'N/A'),
    (v_campus_b_id, 'HRN-B-' || left(v_campus_b_id::text, 6), 'Harness Campus B ' || left(v_campus_b_id::text, 6), 'N/A');

  insert into public.academic_year (id, start_year, end_year)
  values
    (v_year_a_id, 2090, 2091),
    (v_year_b_id, 2091, 2092);

  insert into public.academic_term (id, academic_year_id, name, start, "end")
  values
    (v_term_1_id, v_year_a_id, 'FIRST SEMESTER', '2090-08-01', '2090-12-15'),
    (v_term_2_id, v_year_a_id, 'SECOND SEMESTER', '2091-01-10', '2091-05-31'),
    (v_term_3_id, v_year_a_id, 'MIDYEAR', '2091-06-01', '2091-07-15'),
    (v_term_4_id, v_year_b_id, 'FIRST SEMESTER', '2091-08-01', '2091-12-15'),
    (v_term_5_id, v_year_b_id, 'SECOND SEMESTER', '2092-01-10', '2092-05-31');

  -- Guard campus proposal for "only matching scope invalidates" checks.
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_b_id,
    v_term_1_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_guard_campus_proposal_id;

  -- --------------------------------------------------------------
  -- CASE 1: insert ACTIVE individual proposal invalidates campus scope
  -- --------------------------------------------------------------
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_a_id,
    v_term_1_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_1_campus_proposal_id;

  insert into public.proposal (
    id,
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_campus_a_id,
    v_term_1_id,
    'Regular',
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_1_proposal_id;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_1_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 1 failed: expected campus proposal INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_CREATED' then
    raise exception 'CASE 1 failed: expected reason INDIVIDUAL_PROPOSAL_CREATED, got %', coalesce(v_reason, '<null>');
  end if;

  select cp.lifecycle_status
  into v_status
  from public.campus_proposal cp
  where cp.id = v_guard_campus_proposal_id;

  if v_status <> 'ACTIVE' then
    raise exception 'CASE 1 scope guard failed: unrelated campus proposal changed to %', v_status;
  end if;

  -- --------------------------------------------------------------
  -- CASE 2: transition individual proposal -> INVALIDATED
  -- --------------------------------------------------------------
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_a_id,
    v_term_2_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_2_campus_proposal_id;

  insert into public.proposal (
    id,
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_campus_a_id,
    v_term_2_id,
    'Regular',
    'APPROVED',
    v_user_id
  )
  returning id into v_case_2_proposal_id;

  update public.proposal
  set lifecycle_status = 'INVALIDATED',
      invalidated_reason = 'HARNESS_CASE_2',
      updated_at = now()
  where id = v_case_2_proposal_id;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_2_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 2 failed: expected campus proposal INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_INVALIDATED' then
    raise exception 'CASE 2 failed: expected reason INDIVIDUAL_PROPOSAL_INVALIDATED, got %', coalesce(v_reason, '<null>');
  end if;

  -- --------------------------------------------------------------
  -- CASE 3: transition individual proposal -> REJECTED
  -- --------------------------------------------------------------
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_a_id,
    v_term_3_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_3_campus_proposal_id;

  insert into public.proposal (
    id,
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_campus_a_id,
    v_term_3_id,
    'Regular',
    'APPROVED',
    v_user_id
  )
  returning id into v_case_3_proposal_id;

  update public.proposal
  set lifecycle_status = 'REJECTED',
      updated_at = now()
  where id = v_case_3_proposal_id;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_3_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 3 failed: expected campus proposal INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_REJECTED' then
    raise exception 'CASE 3 failed: expected reason INDIVIDUAL_PROPOSAL_REJECTED, got %', coalesce(v_reason, '<null>');
  end if;

  -- --------------------------------------------------------------
  -- CASE 4: delete individual proposal
  -- --------------------------------------------------------------
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_a_id,
    v_term_4_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_4_campus_proposal_id;

  insert into public.proposal (
    id,
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_campus_a_id,
    v_term_4_id,
    'Regular',
    'APPROVED',
    v_user_id
  )
  returning id into v_case_4_proposal_id;

  delete from public.proposal
  where id = v_case_4_proposal_id;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_4_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 4 failed: expected campus proposal INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_DELETED' then
    raise exception 'CASE 4 failed: expected reason INDIVIDUAL_PROPOSAL_DELETED, got %', coalesce(v_reason, '<null>');
  end if;

  -- --------------------------------------------------------------
  -- CASE 5: individual proposal scope change invalidates old + new scopes
  -- --------------------------------------------------------------
  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_a_id,
    v_term_5_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_5_old_scope_campus_proposal_id;

  insert into public.campus_proposal (
    id,
    campus_id,
    academic_term_id,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_campus_b_id,
    v_term_2_id,
    'ACTIVE',
    v_user_id
  )
  returning id into v_case_5_new_scope_campus_proposal_id;

  insert into public.proposal (
    id,
    user_id,
    campus_id,
    academic_term_id,
    employment_status,
    lifecycle_status,
    created_by_user_id
  )
  values (
    gen_random_uuid(),
    v_user_id,
    v_campus_a_id,
    v_term_5_id,
    'Regular',
    'APPROVED',
    v_user_id
  )
  returning id into v_case_5_proposal_id;

  update public.proposal
  set campus_id = v_campus_b_id,
      academic_term_id = v_term_2_id,
      updated_at = now()
  where id = v_case_5_proposal_id;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_5_old_scope_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 5 old scope failed: expected INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED' then
    raise exception 'CASE 5 old scope failed: expected reason INDIVIDUAL_PROPOSAL_SCOPE_CHANGED, got %', coalesce(v_reason, '<null>');
  end if;

  select cp.lifecycle_status, cp.invalidated_reason
  into v_status, v_reason
  from public.campus_proposal cp
  where cp.id = v_case_5_new_scope_campus_proposal_id;

  if v_status <> 'INVALIDATED' then
    raise exception 'CASE 5 new scope failed: expected INVALIDATED, got %', v_status;
  end if;
  if v_reason <> 'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED' then
    raise exception 'CASE 5 new scope failed: expected reason INDIVIDUAL_PROPOSAL_SCOPE_CHANGED, got %', coalesce(v_reason, '<null>');
  end if;

  raise notice 'Campus proposal invalidation regression harness: PASS';
end
$$;

rollback;
