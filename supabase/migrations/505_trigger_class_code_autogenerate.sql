-- =========================================================
-- TRIGGER: Auto-generate class code when utilization links a class
-- Format: C{A-Z}{NNN} (e.g. CA001)
-- The counter is scoped per academic term.
-- =========================================================

create or replace function public.generate_class_code_from_utilization()
returns trigger
language plpgsql
as $$
declare
  v_term_id    uuid;
  v_max_index  integer;
  v_next_index integer;
  v_letter_idx integer;
  v_number     integer;
  v_letter     text;
  v_existing_code text;
begin
  if new.class_id is null then
    return new;
  end if;

  select c.code
    into v_existing_code
  from public.class c
  where c.id = new.class_id;

  if v_existing_code is not null
     and v_existing_code <> ''
     and v_existing_code !~ '^TMP-' then
    return new;
  end if;

  -- Fetch the academic term for this class via section.
  select b.academic_term_id
    into v_term_id
  from public.section b
  where b.id = new.section_id;

  if v_term_id is null then
    raise exception 'Invalid section_id: no matching section found';
  end if;

  -- Serialize code assignment per term to avoid race conditions.
  perform pg_advisory_xact_lock(hashtext(v_term_id::text || ':class_code'));

  -- Determine the next sequence index within this term.
  select max(
      ((ascii(substring(c.code, 2, 1)) - ascii('A')) * 999)
      + (substring(c.code, 3, 3))::int
    )
    into v_max_index
  from public.class c
  join public.course_utilization cu
    on cu.class_id = c.id
  join public.section b
    on b.id = cu.section_id
  where b.academic_term_id = v_term_id
    and c.code ~ '^C[A-Z][0-9]{3}$';

  v_next_index := coalesce(v_max_index, 0) + 1;
  if v_next_index > 26 * 999 then
    raise exception 'Class code capacity exceeded for academic term %', v_term_id;
  end if;

  v_letter_idx := floor((v_next_index - 1) / 999)::int;
  v_number := ((v_next_index - 1) % 999) + 1;
  v_letter := chr(ascii('A') + v_letter_idx);

  update public.class
  set code = 'C' || v_letter || lpad(v_number::text, 3, '0')
  where id = new.class_id;

  return new;
end;
$$;

drop trigger if exists trg_course_utilization_generate_class_code
  on public.course_utilization;

create trigger trg_course_utilization_generate_class_code
before insert or update of class_id
on public.course_utilization
for each row
execute function public.generate_class_code_from_utilization();
