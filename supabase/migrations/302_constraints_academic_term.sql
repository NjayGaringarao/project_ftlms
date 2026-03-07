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

    -- Academic term should be reasonable and consistent.
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_year_start_minimum'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_year_start_minimum check (academic_year_start >= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_year_range_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_year_range_valid
      check (academic_year_end >= academic_year_start);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_date_range_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_date_range_valid
      check ("end" >= start);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_type_term_order_valid'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_type_term_order_valid
      check (
        (type = 'SEMESTER' and term_order in ('FIRST', 'SECOND'))
        or (type = 'TRIMESTER' and term_order in ('FIRST', 'SECOND', 'THIRD'))
        or (type = 'QUARTER' and term_order in ('FIRST', 'SECOND', 'THIRD', 'FOURTH'))
      );
  end if;
  
end;
$$;


