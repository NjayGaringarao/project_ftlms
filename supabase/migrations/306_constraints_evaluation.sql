do $$
begin
  -- Multiple same evaluation for a designation and schedule is not allowed.
  if not exists (
    select 1 from pg_constraint
    where conname = 'evaluation_designation_schedule_unique'
      and conrelid = 'public.evaluation'::regclass
  ) then
    alter table public.evaluation
      add constraint evaluation_designation_schedule_unique unique (designation_id, schedule_id);
  end if;
end;
$$;
