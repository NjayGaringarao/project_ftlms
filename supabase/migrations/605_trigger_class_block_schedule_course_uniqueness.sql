create or replace function public.enforce_class_block_schedule_course_uniqueness()
returns trigger
language plpgsql
as $$
declare
  new_schedule_id uuid;
  new_course_id uuid;
begin
  select c.schedule_id, c.course_id
    into new_schedule_id, new_course_id
  from public.class c
  where c.id = new.class_id;

  if new_schedule_id is null or new_course_id is null then
    raise exception 'Invalid class_id reference for class_block';
  end if;

  if exists (
    select 1
    from public.class_block cb
    join public.class c
      on c.id = cb.class_id
    where cb.block_id = new.block_id
      and c.schedule_id = new_schedule_id
      and c.course_id = new_course_id
      and cb.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception 'class_block_duplicate_schedule_course_block';
  end if;

  return new;
end;
$$;

drop trigger if exists class_block_schedule_course_uniqueness_trigger
  on public.class_block;

create trigger class_block_schedule_course_uniqueness_trigger
before insert or update of class_id, block_id
on public.class_block
for each row
execute function public.enforce_class_block_schedule_course_uniqueness();
