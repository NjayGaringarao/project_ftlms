create or replace function public.enforce_class_term_consistency()
returns trigger
language plpgsql
as $$
declare
  new_term_id uuid;
  existing_term_id uuid;
begin
  if new.class_id is null then
    return new;
  end if;

  select b.academic_term_id
    into new_term_id
  from public.section b
  where b.id = new.section_id;

  if new_term_id is null then
    raise exception 'Invalid section_id reference for course_utilization';
  end if;

  select b.academic_term_id
    into existing_term_id
  from public.course_utilization cu
  join public.section b on b.id = cu.section_id
  where cu.class_id = new.class_id
    and cu.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  limit 1;

  if existing_term_id is not null and existing_term_id <> new_term_id then
    raise exception 'class_section_term_mismatch';
  end if;

  return new;
end;
$$;

drop trigger if exists course_utilization_term_consistency_trigger
  on public.course_utilization;

create trigger course_utilization_term_consistency_trigger
before insert or update of class_id, section_id
on public.course_utilization
for each row
execute function public.enforce_class_term_consistency();
