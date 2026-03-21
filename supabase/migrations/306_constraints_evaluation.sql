do $$
begin
  -- Multiple same evaluation for a designation and proposal is not allowed.
  if not exists (
    select 1 from pg_constraint
    where conname = 'evaluation_designation_proposal_unique'
      and conrelid = 'public.evaluation'::regclass
  ) then
    alter table public.evaluation
      add constraint evaluation_designation_proposal_unique unique (designation_id, proposal_id);
  end if;
end;
$$;
