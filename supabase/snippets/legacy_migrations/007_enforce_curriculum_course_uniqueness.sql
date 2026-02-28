do $$
begin
  if exists (
    select 1
    from course_c_t cct
    join curriculum_at ca
      on ca.id = cct.curriculum_at_id
    group by ca.curriculum_id, cct.course_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot apply migration: duplicate course links across terms exist for at least one curriculum. Resolve duplicates first.';
  end if;
end
$$;

create index if not exists idx_curriculum_at_curriculum_id
  on curriculum_at (curriculum_id);

create index if not exists idx_course_c_t_course_id
  on course_c_t (course_id);

create or replace function enforce_course_unique_per_curriculum()
returns trigger
language plpgsql
as $$
declare
  target_curriculum_id uuid;
begin
  select curriculum_id
  into target_curriculum_id
  from curriculum_at
  where id = new.curriculum_at_id;

  if target_curriculum_id is null then
    raise exception 'Curriculum term link not found for curriculum_at_id: %', new.curriculum_at_id;
  end if;

  if exists (
    select 1
    from course_c_t cct
    join curriculum_at ca
      on ca.id = cct.curriculum_at_id
    where ca.curriculum_id = target_curriculum_id
      and cct.course_id = new.course_id
      and cct.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception
      using
        errcode = '23505',
        message = 'duplicate key value violates unique constraint "course_c_t_curriculum_course_unique"',
        detail = 'A course can only be linked once per curriculum across all terms.';
  end if;

  return new;
end
$$;

drop trigger if exists trg_enforce_course_unique_per_curriculum
  on course_c_t;

create trigger trg_enforce_course_unique_per_curriculum
before insert or update of curriculum_at_id, course_id
on course_c_t
for each row
execute function enforce_course_unique_per_curriculum();
