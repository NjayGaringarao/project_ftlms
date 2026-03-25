-- =========================================================
-- TRIGGER: Auto-generate block code on insert
-- Format: {program_offering.code token #2} {major_offering.code token #3} {year}-{section}
-- Example: BSCS GEN 4-A
-- =========================================================

create or replace function public.generate_block_code()
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
    raise exception 'Invalid major_offering_id for block';
  end if;

  v_program_token := split_part(v_program_offering_code, ' ', 2);
  v_major_token := split_part(v_major_offering_code, ' ', 3);

  if v_program_token = '' or v_major_token = '' then
    raise exception 'Unable to derive block code tokens from offering codes';
  end if;

  new.code := v_program_token || ' ' || v_major_token || ' ' || new.year_level || '-' || new.section;

  return new;
end;
$$;

drop trigger if exists trg_block_generate_code on public.block;

create trigger trg_block_generate_code
before insert
on public.block
for each row
execute function public.generate_block_code();
