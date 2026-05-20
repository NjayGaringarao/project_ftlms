-- =========================================================
-- Campus-college load workflow regression harness
--
-- Execute against a development database only. The test creates temporary
-- auth/users/designations and rolls back automatically.
-- =========================================================

begin;

do $$
declare
  v_campus_id uuid;
  v_college_id uuid;
  v_program_offering_id uuid;
  v_term_id uuid;
  v_chair_user_id uuid := gen_random_uuid();
  v_peer_chair_user_id uuid := gen_random_uuid();
  v_cd_user_id uuid := gen_random_uuid();
  v_di_user_id uuid := gen_random_uuid();
  v_vpaa_user_id uuid := gen_random_uuid();
  v_chair_designation_id uuid;
  v_peer_chair_designation_id uuid;
  v_cd_designation_id uuid;
  v_di_designation_id uuid;
  v_vpaa_designation_id uuid;
  v_load_id uuid;
  v_revision_1_id uuid;
  v_revision_2_id uuid;
  v_status public.campus_college_load_status_enum;
  v_step public.campus_college_load_step_enum;
begin
  select po.id, po.campus_id, p.college_id
  into v_program_offering_id, v_campus_id, v_college_id
  from public.program_offering po
  join public.program p on p.id = po.program_id
  limit 1;

  select id into v_term_id from public.academic_term limit 1;

  if v_program_offering_id is null or v_term_id is null then
    raise exception 'Regression test requires at least one program offering and academic term.';
  end if;

  insert into auth.users (id, aud, role, email)
  values
    (v_chair_user_id, 'authenticated', 'authenticated', 'ccl-chair@example.test'),
    (v_peer_chair_user_id, 'authenticated', 'authenticated', 'ccl-peer-chair@example.test'),
    (v_cd_user_id, 'authenticated', 'authenticated', 'ccl-cd@example.test'),
    (v_di_user_id, 'authenticated', 'authenticated', 'ccl-di@example.test'),
    (v_vpaa_user_id, 'authenticated', 'authenticated', 'ccl-vpaa@example.test');

  insert into public."user" (id, employment_status, campus_id, college_id)
  values
    (v_chair_user_id, 'Regular', v_campus_id, v_college_id),
    (v_peer_chair_user_id, 'Regular', v_campus_id, v_college_id),
    (v_cd_user_id, 'Regular', v_campus_id, v_college_id),
    (v_di_user_id, 'Regular', null, null),
    (v_vpaa_user_id, 'Regular', null, null);

  insert into public.designation (user_id, program_offering_id, job_title)
  values (v_chair_user_id, v_program_offering_id, 'Program Chairperson')
  returning id into v_chair_designation_id;

  insert into public.designation (user_id, program_offering_id, job_title)
  values (v_peer_chair_user_id, v_program_offering_id, 'Program Chairperson')
  returning id into v_peer_chair_designation_id;

  insert into public.designation (user_id, campus_id, job_title)
  values (v_cd_user_id, v_campus_id, 'Campus Director')
  returning id into v_cd_designation_id;

  insert into public.designation (user_id, job_title)
  values (v_di_user_id, 'Director for Instruction')
  returning id into v_di_designation_id;

  insert into public.designation (user_id, job_title)
  values (v_vpaa_user_id, 'Vice President for Academic Affairs')
  returning id into v_vpaa_designation_id;

  insert into public.campus_college_load (
    campus_id,
    college_id,
    academic_term_id,
    created_by_user_id,
    created_by_designation_id
  ) values (
    v_campus_id,
    v_college_id,
    v_term_id,
    v_chair_user_id,
    v_chair_designation_id
  ) returning id into v_load_id;

  insert into public.campus_college_load_revision (
    campus_college_load_id,
    revision_number,
    snapshot,
    submitted_by_user_id,
    submitted_by_designation_id
  ) values (
    v_load_id,
    1,
    jsonb_build_object('test', true),
    v_chair_user_id,
    v_chair_designation_id
  ) returning id into v_revision_1_id;

  select status, current_step
  into v_status, v_step
  from public.campus_college_load
  where id = v_load_id;

  if v_status <> 'SUBMITTED' or v_step <> 'CAMPUS_DIRECTOR' then
    raise exception 'Revision submit did not move load to Campus Director.';
  end if;

  begin
    insert into public.campus_college_load_evaluation (
      campus_college_load_revision_id,
      step,
      evaluator_user_id,
      designation_id,
      status,
      comment
    ) values (
      v_revision_1_id,
      'DIRECTOR_FOR_INSTRUCTION',
      v_di_user_id,
      v_di_designation_id,
      'APPROVED',
      null
    );
    raise exception 'DI acted before Campus Director approval.';
  exception
    when others then
      if sqlerrm = 'DI acted before Campus Director approval.' then
        raise;
      end if;
  end;

  begin
    insert into public.campus_college_load_evaluation (
      campus_college_load_revision_id,
      step,
      evaluator_user_id,
      designation_id,
      status,
      comment
    ) values (
      v_revision_1_id,
      'CAMPUS_DIRECTOR',
      v_cd_user_id,
      v_cd_designation_id,
      'RETURNED',
      null
    );
    raise exception 'Return without comment was accepted.';
  exception
    when others then
      if sqlerrm = 'Return without comment was accepted.' then
        raise;
      end if;
  end;

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    evaluator_user_id,
    designation_id,
    status,
    comment
  ) values (
    v_revision_1_id,
    'CAMPUS_DIRECTOR',
    v_cd_user_id,
    v_cd_designation_id,
    'RETURNED',
    'Revise the load.'
  );

  select status, current_step
  into v_status, v_step
  from public.campus_college_load
  where id = v_load_id;

  if v_status <> 'RETURNED' or v_step <> 'PROGRAM_CHAIR' then
    raise exception 'Return did not move load back to Program Chair.';
  end if;

  insert into public.campus_college_load_revision (
    campus_college_load_id,
    revision_number,
    snapshot,
    submitted_by_user_id,
    submitted_by_designation_id
  ) values (
    v_load_id,
    2,
    jsonb_build_object('test', true, 'revision', 2),
    v_peer_chair_user_id,
    v_peer_chair_designation_id
  ) returning id into v_revision_2_id;

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    evaluator_user_id,
    designation_id,
    status
  ) values (
    v_revision_2_id,
    'CAMPUS_DIRECTOR',
    v_cd_user_id,
    v_cd_designation_id,
    'APPROVED'
  );

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    evaluator_user_id,
    designation_id,
    status
  ) values (
    v_revision_2_id,
    'DIRECTOR_FOR_INSTRUCTION',
    v_di_user_id,
    v_di_designation_id,
    'APPROVED'
  );

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    evaluator_user_id,
    designation_id,
    status
  ) values (
    v_revision_2_id,
    'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS',
    v_vpaa_user_id,
    v_vpaa_designation_id,
    'APPROVED'
  );

  select status, current_step
  into v_status, v_step
  from public.campus_college_load
  where id = v_load_id;

  if v_status <> 'APPROVED' or v_step <> 'COMPLETED' then
    raise exception 'VPAA approval did not finalize the load.';
  end if;
end;
$$;

rollback;
