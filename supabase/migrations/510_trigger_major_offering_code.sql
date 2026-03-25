-- =========================================================
-- TRIGGER: Auto-generate major offering code on insert
-- Format: {campus.code} {program.code} {major.code} (e.g. CST BSCS GEN)
-- =========================================================

create or replace function public.generate_major_offering_code()
returns trigger
language plpgsql
as $$
declare
  v_campus_code text;
  v_program_code text;
  v_major_code text;
begin
  select c.code, p.code
    into v_campus_code, v_program_code
  from public.program_offering po
  join public.campus c on c.id = po.campus_id
  join public.program p on p.id = po.program_id
  where po.id = new.program_offering_id;

  select m.code
    into v_major_code
  from public.major m
  where m.id = new.major_id;

  if v_campus_code is null or v_program_code is null or v_major_code is null then
    raise exception 'Invalid program_offering_id or major_id for major_offering';
  end if;

  new.code := v_campus_code || ' ' || v_program_code || ' ' || v_major_code;

  return new;
end;
$$;

drop trigger if exists trg_major_offering_generate_code on public.major_offering;

create trigger trg_major_offering_generate_code
before insert
on public.major_offering
for each row
execute function public.generate_major_offering_code();
