do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where indexname = 'campus_name_ci_unique'
  ) then
    create unique index campus_name_ci_unique on campus ((lower(name)));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'rank_number_unique'
  ) then
    alter table rank
      add constraint rank_number_unique unique (number);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where indexname = 'rank_title_ci_unique'
  ) then
    create unique index rank_title_ci_unique on rank ((lower(title)));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where indexname = 'semester_academic_year_term_ci_unique'
  ) then
    create unique index semester_academic_year_term_ci_unique
      on semester ((lower(academic_year)), (lower(term)));
  end if;
end $$;
