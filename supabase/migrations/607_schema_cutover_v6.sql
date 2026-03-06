-- =========================================================
-- SCHEMA CUTOVER (V6)
-- Description:
--   Hard-cut from department/curriculum/course_offering to:
--   college + program_offering/major_offering + class/class_block.
-- =========================================================

-- 1) Move department data to college (preserve IDs for FK backfill).
insert into public.college (id, code, name, type, description)
select
  d.id,
  d.code,
  d.name,
  case d.type::text
    when 'ACADEMIC' then 'ACADEMIC'::public.college_type_enum
    when 'ADMINISTRATIVE' then 'ADMINISTRATIVE'::public.college_type_enum
    when 'STUDENT_SERVICES' then 'STUDENT_SERVICES'::public.college_type_enum
    when 'EXTENSION_SERVICES' then 'EXTENSION_SERVICES'::public.college_type_enum
    else 'ACADEMIC'::public.college_type_enum
  end as type,
  d.description
from public.department d
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  type = excluded.type,
  description = excluded.description;

-- 2) Program now belongs to college.
alter table public.program
  add column if not exists college_id uuid references public.college(id) on delete cascade;

update public.program p
set college_id = p.department_id
where p.college_id is null
  and p.department_id is not null;

do $$
begin
  if exists (
    select 1
    from public.program
    where college_id is null
  ) then
    raise exception 'program.college_id contains null values after v6 backfill';
  end if;
end
$$;

alter table public.program
  alter column college_id set not null;

-- 3) Designation now references college.
alter table public.designation
  add column if not exists college_id uuid references public.college(id) on delete cascade;

update public.designation d
set college_id = d.department_id
where d.college_id is null
  and d.department_id is not null;

-- 4) Replace old designation role context check with college-based rule.
alter table public.designation
  drop constraint if exists designation_role_context_rules;

alter table public.designation
  add constraint designation_role_context_rules
  check (
    (
      lower(trim(job_title::text)) in ('university president', 'director for instruction')
    )
    or (
      lower(trim(job_title::text)) in ('program chair', 'program chairperson')
      and program_offering_id is not null
    )
    or (
      lower(trim(job_title::text)) = 'college dean'
      and college_id is not null
    )
    or (
      lower(trim(job_title::text)) = 'campus director'
      and campus_id is not null
    )
    or (
      lower(trim(job_title::text)) not in (
        'university president',
        'director for instruction',
        'program chair',
        'program chairperson',
        'college dean',
        'campus director'
      )
      and (
        campus_id is not null
        or college_id is not null
        or program_offering_id is not null
        or room_id is not null
      )
    )
  );

-- 5) Remove old curriculum uniqueness trigger/function.
drop trigger if exists trg_enforce_course_unique_per_curriculum on public.course_offering;
drop function if exists public.enforce_course_unique_per_curriculum();
drop index if exists idx_curriculum_offering_curriculum_id;
drop index if exists idx_course_offering_course_id;

-- 6) Remove legacy curriculum dependency from block.
alter table public.block
  drop constraint if exists block_section_unique;

alter table public.block
  drop column if exists curriculum_id;

-- 7) Remove legacy class_delivery chain and old course offering concept.
alter table public.session
  drop column if exists class_delivery_id;

drop table if exists public.class_delivery_block cascade;
drop table if exists public.class_delivery cascade;
drop table if exists public.course_allocation cascade;
drop table if exists public.course_offering cascade;
drop table if exists public.curriculum_offering cascade;
drop table if exists public.curriculum cascade;

-- 8) Remove department references after backfill.
alter table public.designation
  drop column if exists department_id;

alter table public.program
  drop column if exists department_id;

drop table if exists public.department cascade;
