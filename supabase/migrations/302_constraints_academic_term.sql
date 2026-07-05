do $$
begin

  -- Academic year's code, start, and end should be unique.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_year_unique'
      and conrelid = 'public.academic_year'::regclass
  ) then
    alter table public.academic_year
      add constraint academic_year_unique unique (code, start_year, end_year);
  end if;

  -- Academic term should be reasonable and consistent.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_reasonable_dates_check'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_reasonable_dates_check
      check (
        "start" >= '2000-01-01'
        and "end" <= '2100-12-31'
        and "start" < "end"
      );
  end if;

  -- No two academic terms may have overlapping date ranges (global calendar).
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_no_global_date_overlap'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_no_global_date_overlap
      exclude using gist (daterange("start", "end", '[]') with &&);
  end if;

end;
$$;
