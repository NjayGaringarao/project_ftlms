alter table public.campus
  drop column if exists zip_code,
  add column if not exists code text;

-- Backfill campus code from campus name if not already present.
update public.campus
set code = upper(left(regexp_replace(name, '[^A-Za-z0-9]+', '', 'g'), 3))
where code is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campus_code_unique'
      and conrelid = 'public.campus'::regclass
  ) then
    alter table public.campus
      add constraint campus_code_unique unique (code);
  end if;
end
$$;

alter table public.campus
  alter column code set not null;

create table if not exists public.college (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  type public.college_type_enum not null,
  description text
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'college_code_unique'
      and conrelid = 'public.college'::regclass
  ) then
    alter table public.college
      add constraint college_code_unique unique (code);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'college_name_unique'
      and conrelid = 'public.college'::regclass
  ) then
    alter table public.college
      add constraint college_name_unique unique (name);
  end if;
end
$$;