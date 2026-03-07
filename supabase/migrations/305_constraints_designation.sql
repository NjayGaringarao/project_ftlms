do $$
begin
  -- Designation load should be non-negative.
  if not exists (
    select 1 from pg_constraint
    where conname = 'designation_load_nonnegative'
      and conrelid = 'public.designation'::regclass
  ) then
    alter table public.designation
      add constraint designation_load_nonnegative check (load >= 0);
  end if;

  -- Designation role should have consistent context rules.
  -- Note: uniqueness is enforced by 503_triggers_designation_uniqueness.sql.
  if not exists (
    select 1 from pg_constraint
    where conname = 'designation_role_context_rules'
      and conrelid = 'public.designation'::regclass
  ) then
    alter table public.designation
      add constraint designation_role_context_rules
      check (
        (
          lower(trim(job_title::text)) in ('university president', 'director for instruction')
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
  end if;
end;
$$;
