-- Prevent deleting course_utilization when its class has sessions

create or replace function public.prevent_course_utilization_delete_with_sessions()
returns trigger
language plpgsql
as $$
begin
  if old.class_id is null then
    return old;
  end if;

  if exists (
    select 1
    from public.session_class sc
    where sc.class_id = old.class_id
    limit 1
  ) then
    raise exception 'Cannot delete course utilization: class has scheduled sessions';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_delete_course_utilization_with_sessions on public.course_utilization;
create trigger trg_prevent_delete_course_utilization_with_sessions
before delete on public.course_utilization
for each row
execute function public.prevent_course_utilization_delete_with_sessions();
