-- =========================================================
-- TRIGGER: Auto-generate program offering code on insert
-- Format: {campus.code} {program.code} (e.g. CST BSCS)
-- =========================================================

create or replace function public.generate_program_offering_code()
returns trigger
language plpgsql
as $$
declare
  v_campus_code text;
  v_program_code text;
begin
  select c.code, p.code
    into v_campus_code, v_program_code
  from public.campus c
  join public.program p on p.id = new.program_id
  where c.id = new.campus_id;

  if v_campus_code is null or v_program_code is null then
    raise exception 'Invalid campus_id or program_id for program_offering';
  end if;

  new.code := v_campus_code || ' ' || v_program_code;

  return new;
end;
$$;

drop trigger if exists trg_program_offering_generate_code on public.program_offering;

create trigger trg_program_offering_generate_code
before insert
on public.program_offering
for each row
execute function public.generate_program_offering_code();
