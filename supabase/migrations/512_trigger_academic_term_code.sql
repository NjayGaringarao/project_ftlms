-- =========================================================
-- TRIGGER: Auto-generate academic term code on insert
-- Format: {TERM_NAME_SHORT} - AY {academic_year.code}
-- Example: SECOND SEM - AY 2024-2025
-- =========================================================

create or replace function public.generate_academic_term_code()
returns trigger
language plpgsql
as $$
declare
  v_year_code text;
  v_term_short text;
begin
  select ay.code
    into v_year_code
  from public.academic_year ay
  where ay.id = new.academic_year_id;

  if v_year_code is null then
    raise exception 'Invalid academic_year_id for academic_term';
  end if;

  v_term_short := case new.name
    when 'FIRST SEMESTER' then 'FIRST SEM'
    when 'SECOND SEMESTER' then 'SECOND SEM'
    when 'MIDYEAR' then 'MIDYEAR'
    else null
  end;

  if v_term_short is null then
    raise exception 'Invalid academic_term name for code generation';
  end if;

  new.code := v_term_short || ' - AY ' || v_year_code;

  return new;
end;
$$;

drop trigger if exists trg_academic_term_generate_code on public.academic_term;

create trigger trg_academic_term_generate_code
before insert
on public.academic_term
for each row
execute function public.generate_academic_term_code();
