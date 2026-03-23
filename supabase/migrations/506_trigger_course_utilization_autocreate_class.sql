-- Auto-create class for new course_utilization rows

create or replace function public.autocreate_class_for_course_utilization()
returns trigger
language plpgsql
as $$
declare
  new_class_id uuid;
begin
  if new.class_id is not null then
    return new;
  end if;

  insert into public.class (code)
  values ('TMP-' || gen_random_uuid()::text)
  returning id into new_class_id;

  new.class_id := new_class_id;
  return new;
end;
$$;

drop trigger if exists trg_autocreate_class_for_course_utilization on public.course_utilization;

create trigger trg_autocreate_class_for_course_utilization
before insert on public.course_utilization
for each row
execute function public.autocreate_class_for_course_utilization();
