do $$
begin
  -- Program offering should be unique within a campus.
  if not exists (
    select 1 from pg_constraint
    where conname = 'program_offering_unique'
      and conrelid = 'public.program_offering'::regclass
  ) then
    alter table public.program_offering
      add constraint program_offering_unique unique (campus_id, program_id);
  end if;

  -- Major offering should be unique within a program offering.
  if not exists (
    select 1 from pg_constraint
    where conname = 'major_offering_unique'
      and conrelid = 'public.major_offering'::regclass
  ) then
    alter table public.major_offering
      add constraint major_offering_unique unique (program_offering_id, major_id);
  end if;
end;
$$;
