do $$
begin
  if exists (
    select 1
    from public.course_offering co
    join public.curriculum_offering cfo
      on cfo.id = co.curriculum_offering_id
    group by cfo.curriculum_id, co.course_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot apply migration: duplicate course links across terms exist for at least one curriculum. Resolve duplicates first.';
  end if;
end;
$$;

create index if not exists idx_curriculum_offering_curriculum_id
  on public.curriculum_offering (curriculum_id);

create index if not exists idx_course_offering_course_id
  on public.course_offering (course_id);

create or replace function public.enforce_course_unique_per_curriculum()
returns trigger
language plpgsql
as $$
declare
  target_curriculum_id uuid;
begin
  select cfo.curriculum_id
  into target_curriculum_id
  from public.curriculum_offering cfo
  where cfo.id = new.curriculum_offering_id;

  if target_curriculum_id is null then
    raise exception 'Curriculum offering link not found for curriculum_offering_id: %', new.curriculum_offering_id;
  end if;

  if exists (
    select 1
    from public.course_offering co
    join public.curriculum_offering cfo
      on cfo.id = co.curriculum_offering_id
    where cfo.curriculum_id = target_curriculum_id
      and co.course_id = new.course_id
      and co.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception
      using
        errcode = '23505',
        message = 'duplicate key value violates unique constraint "course_offering_curriculum_course_unique"',
        detail = 'A course can only be linked once per curriculum across all terms.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_course_unique_per_curriculum on public.course_offering;
create trigger trg_enforce_course_unique_per_curriculum
before insert or update of curriculum_offering_id, course_id
on public.course_offering
for each row
execute function public.enforce_course_unique_per_curriculum();
