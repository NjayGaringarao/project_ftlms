create or replace function public.enforce_designation_role_uniqueness()
returns trigger
language plpgsql
as $$
declare
  normalized_title text;
  current_id uuid;
begin
  normalized_title := lower(trim(new.job_title::text));
  current_id := coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if normalized_title = 'university president' then
    if exists (
      select 1
      from public.designation d
      where lower(trim(d.job_title::text)) = 'university president'
        and d.id <> current_id
    ) then
      raise exception
        using
          errcode = '23505',
          message = 'duplicate key value violates unique constraint "designation_university_president_unique"',
          detail = 'Only one university president designation is allowed.';
    end if;
  end if;

  if normalized_title = 'director for instruction' then
    if exists (
      select 1
      from public.designation d
      where lower(trim(d.job_title::text)) = 'director for instruction'
        and d.id <> current_id
    ) then
      raise exception
        using
          errcode = '23505',
          message = 'duplicate key value violates unique constraint "designation_director_instruction_unique"',
          detail = 'Only one director for instruction designation is allowed.';
    end if;
  end if;

  if normalized_title = 'campus director'
    and new.campus_id is not null
  then
    if exists (
      select 1
      from public.designation d
      where lower(trim(d.job_title::text)) = 'campus director'
        and d.campus_id = new.campus_id
        and d.id <> current_id
    ) then
      raise exception
        using
          errcode = '23505',
          message = 'duplicate key value violates unique constraint "designation_campus_director_per_campus_unique"',
          detail = 'Only one campus director designation is allowed per campus.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_designation_role_uniqueness on public.designation;
create trigger trg_enforce_designation_role_uniqueness
before insert or update of job_title, campus_id
on public.designation
for each row
execute function public.enforce_designation_role_uniqueness();
