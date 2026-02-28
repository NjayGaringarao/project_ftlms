do $$
begin

  -- Academic years should not overlap for the same type and term order.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_year_no_overlap'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_year_no_overlap
      exclude using gist (
        academic_year_start with =,
        academic_year_end with =,
        type with =,
        term_order with =,
        daterange(start, "end", '[)') with &&
      );
  end if;
end;
$$;
