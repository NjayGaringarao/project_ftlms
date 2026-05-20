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
  v_program_id uuid;
  v_peer_program_id uuid;
  v_program_offering_id uuid;
  v_peer_program_offering_id uuid;
  v_major_id uuid;
  v_peer_major_id uuid;
  v_major_offering_id uuid;
  v_course_id uuid;
  v_academic_year_id uuid;
  v_term_id uuid;
  v_section_id uuid;
  v_class_id uuid;
  v_session_id uuid;
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
  v_revision_3_id uuid;
  v_status public.campus_college_load_status_enum;
  v_step public.campus_college_load_step_enum;
  v_auto_return_count integer;
  v_suffix text := replace(gen_random_uuid()::text, '-', '');
begin
  insert into public.campus (code, name, address)
  values ('CCL-' || left(v_suffix, 8), 'Campus College Load Campus ' || v_suffix, 'Test')
  returning id into v_campus_id;

  insert into public.college (code, name, description)
  values ('CCL-' || left(v_suffix, 7), 'Campus College Load College ' || v_suffix, 'Test')
  returning id into v_college_id;

  insert into public.program (college_id, code, name, description)
  values (v_college_id, 'CCL-PROG-' || left(v_suffix, 8), 'Campus College Load Program ' || v_suffix, 'Test')
  returning id into v_program_id;

  insert into public.major (program_id, code, name, description)
  values (v_program_id, 'MAJ-' || left(v_suffix, 8), 'Campus College Load Major ' || v_suffix, 'Test')
  returning id into v_major_id;

  insert into public.program_offering (code, campus_id, program_id)
  values ('PO-' || left(v_suffix, 8), v_campus_id, v_program_id)
  returning id into v_program_offering_id;

  insert into public.program (college_id, code, name, description)
  values (v_college_id, 'CCL-PEER-PROG-' || left(v_suffix, 8), 'Campus College Load Peer Program ' || v_suffix, 'Test')
  returning id into v_peer_program_id;

  insert into public.major (program_id, code, name, description)
  values (v_peer_program_id, 'PEER-MAJ-' || left(v_suffix, 8), 'Campus College Load Peer Major ' || v_suffix, 'Test')
  returning id into v_peer_major_id;

  insert into public.program_offering (code, campus_id, program_id)
  values ('PEER-PO-' || left(v_suffix, 8), v_campus_id, v_peer_program_id)
  returning id into v_peer_program_offering_id;

  insert into public.course (code, title, lecture_unit, laboratory_unit)
  values ('CCL-COURSE-' || left(v_suffix, 8), 'Campus College Load Course ' || v_suffix, 3, 0)
  returning id into v_course_id;

  insert into public.academic_year (code, start_year, end_year)
  values ('CCL-AY-' || left(v_suffix, 8), 2099, 2100)
  returning id into v_academic_year_id;

  insert into public.academic_term (code, academic_year_id, name, start, "end")
  values ('CCL-TERM-' || left(v_suffix, 8), v_academic_year_id, 'FIRST SEMESTER', '2099-08-01', '2099-12-31')
  returning id into v_term_id;

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
    (v_vpaa_user_id, 'Regular', null, null)
  on conflict (id)
  do update set
    employment_status = excluded.employment_status,
    campus_id = excluded.campus_id,
    college_id = excluded.college_id;

  insert into public.designation (user_id, program_offering_id, job_title)
  values (v_chair_user_id, v_program_offering_id, 'Program Chairperson')
  returning id into v_chair_designation_id;

  insert into public.designation (user_id, program_offering_id, job_title)
  values (v_peer_chair_user_id, v_peer_program_offering_id, 'Program Chairperson')
  returning id into v_peer_chair_designation_id;

  insert into public.designation (user_id, campus_id, job_title)
  values (v_cd_user_id, v_campus_id, 'Campus Director')
  returning id into v_cd_designation_id;

  select id, user_id
  into v_di_designation_id, v_di_user_id
  from public.designation
  where job_title = 'Director for Instruction'
  limit 1;

  if v_di_designation_id is null then
    insert into public.designation (user_id, job_title)
    values (v_di_user_id, 'Director for Instruction')
    returning id into v_di_designation_id;
  end if;

  select id, user_id
  into v_vpaa_designation_id, v_vpaa_user_id
  from public.designation
  where job_title = 'Vice President for Academic Affairs'
  limit 1;

  if v_vpaa_designation_id is null then
    insert into public.designation (user_id, job_title)
    values (v_vpaa_user_id, 'Vice President for Academic Affairs')
    returning id into v_vpaa_designation_id;
  end if;

  insert into public.major_offering (code, program_offering_id, major_id)
  values ('CCL-REG', v_program_offering_id, v_major_id)
  on conflict (program_offering_id, major_id)
  do update set code = excluded.code
  returning id into v_major_offering_id;

  insert into public.section (
    code,
    major_offering_id,
    academic_term_id,
    year_level,
    name,
    classification,
    student_count
  ) values (
    'CCL-REG-SEC',
    v_major_offering_id,
    v_term_id,
    1,
    'Campus College Load Regression',
    'regular',
    25
  ) returning id into v_section_id;

  insert into public.class (code)
  values ('CCL-REG-CLASS')
  returning id into v_class_id;

  insert into public.course_utilization (class_id, course_id, section_id)
  values (v_class_id, v_course_id, v_section_id);

  insert into public.user_class (user_id, class_id)
  values (v_chair_user_id, v_class_id);

  insert into public.session (code, day, start_time, end_time, type)
  values ('CCL-REG-SESSION', 'Monday', '08:00', '09:00', 'Lecture')
  returning id into v_session_id;

  insert into public.session_class (class_id, session_id)
  values (v_class_id, v_session_id);

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

  update public.session
  set start_time = '08:15'
  where id = v_session_id;

  select status, current_step
  into v_status, v_step
  from public.campus_college_load
  where id = v_load_id;

  if v_status <> 'RETURNED' or v_step <> 'PROGRAM_CHAIR' then
    raise exception 'Schedule edit did not automatically return submitted load.';
  end if;

  select count(*)
  into v_auto_return_count
  from public.campus_college_load_evaluation
  where campus_college_load_revision_id = v_revision_1_id
    and status = 'RETURNED'
    and system_generated = true;

  if v_auto_return_count <> 1 then
    raise exception 'Automatic return was not recorded in ladder history.';
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
    status,
    comment
  ) values (
    v_revision_2_id,
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
    3,
    jsonb_build_object('test', true, 'revision', 3),
    v_peer_chair_user_id,
    v_peer_chair_designation_id
  ) returning id into v_revision_3_id;

  insert into public.campus_college_load_evaluation (
    campus_college_load_revision_id,
    step,
    evaluator_user_id,
    designation_id,
    status
  ) values (
    v_revision_3_id,
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
    v_revision_3_id,
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
    v_revision_3_id,
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
