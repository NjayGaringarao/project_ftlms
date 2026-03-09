do $$
begin
  -- Update designation context rules to include VPAA and QA as no-context roles.
  if exists (
    select 1
    from pg_constraint
    where conname = 'designation_role_context_rules'
      and conrelid = 'public.designation'::regclass
  ) then
    alter table public.designation
      drop constraint designation_role_context_rules;
  end if;

  alter table public.designation
    add constraint designation_role_context_rules
    check (
      (
        lower(trim(job_title::text)) in (
          'university president',
          'director for instruction',
          'vice president for academic affairs',
          'quality assurance'
        )
        and campus_id is null
        and college_id is null
        and program_offering_id is null
        and room_id is null
      )
      or (
        lower(trim(job_title::text)) = 'program chairperson'
        and program_offering_id is not null
        and campus_id is null
        and college_id is null
        and room_id is null
      )
      or (
        lower(trim(job_title::text)) = 'college dean'
        and college_id is not null
        and campus_id is null
        and program_offering_id is null
        and room_id is null
      )
      or (
        lower(trim(job_title::text)) = 'campus director'
        and campus_id is not null
        and college_id is null
        and program_offering_id is null
        and room_id is null
      )
      or (
        lower(trim(job_title::text)) not in (
          'university president',
          'director for instruction',
          'vice president for academic affairs',
          'quality assurance',
          'program chairperson',
          'college dean',
          'campus director'
        )
        and (
          campus_id is not null
          or college_id is not null
          or program_offering_id is not null
          or room_id is not null
        )
      )
    );
end;
$$;
