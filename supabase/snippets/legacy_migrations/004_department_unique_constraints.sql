do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_code_unique'
  ) then
    alter table department
      add constraint department_code_unique unique (code);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'department_name_unique'
  ) then
    alter table department
      add constraint department_name_unique unique (name);
  end if;
end $$;
