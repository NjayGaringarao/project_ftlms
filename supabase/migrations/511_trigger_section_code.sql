-- =========================================================
-- TRIGGER: Auto-generate section code on insert
-- Format: {program_offering.code token #2} {major_offering.code token #3} {year}-{name}
-- Example: BSCS GEN 4-A
-- =========================================================

create or replace function public.generate_section_code()
returns trigger
language plpgsql
as $$
declare
  v_program_offering_code text;
  v_major_offering_code text;
  v_program_token text;
  v_major_token text;
begin
  select po.code
    into v_program_offering_code
  from public.program_offering po
  join public.major_offering mo
    on mo.program_offering_id = po.id
  where mo.id = new.major_offering_id;

  select mo.code
    into v_major_offering_code
  from public.major_offering mo
  where mo.id = new.major_offering_id;

  if v_program_offering_code is null or v_major_offering_code is null then
    raise exception 'Invalid major_offering_id for section';
  end if;

  v_program_token := split_part(v_program_offering_code, ' ', 2);
  v_major_token := split_part(v_major_offering_code, ' ', 3);

  if v_program_token = '' or v_major_token = '' then
    raise exception 'Unable to derive section code tokens from offering codes';
  end if;

  new.code := v_program_token || ' ' || v_major_token || ' ' || new.year_level || '-' || new.name;

  return new;
end;
$$;

drop trigger if exists trg_section_generate_code on public.section;

create trigger trg_section_generate_code
before insert
on public.section
for each row
execute function public.generate_section_code();
