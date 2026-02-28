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
    where conname = 'academic_rank_number_unique'
  ) then
    alter table academic_rank
      add constraint academic_rank_number_unique unique (number);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where indexname = 'academic_rank_title_ci_unique'
  ) then
    create unique index academic_rank_title_ci_unique on academic_rank ((lower(title)));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where indexname = 'academic_term_year_code_term_order_ci_unique'
  ) then
    create unique index academic_term_year_code_term_order_ci_unique
      on academic_term (
        academic_year_start,
        academic_year_end,
        (lower(code)),
        term_order
      );
  end if;
end $$;
