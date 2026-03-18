-- =========================================================
-- TRIGGER: Auto-generate academic year code on insert
-- Format: {start_year}-{end_year} (e.g. 2024-2025)
-- =========================================================

create or replace function public.generate_academic_year_code()
returns trigger
language plpgsql
as $$
begin
  if new.start_year is null or new.end_year is null then
    raise exception 'Academic year start and end are required';
  end if;

  new.code := new.start_year::text || '-' || new.end_year::text;

  return new;
end;
$$;

drop trigger if exists trg_academic_year_generate_code on public.academic_year;

create trigger trg_academic_year_generate_code
before insert
on public.academic_year
for each row
execute function public.generate_academic_year_code();
