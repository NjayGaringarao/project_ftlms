-- Consolidate identity name fields before dropping legacy columns.
alter table public.identity
  add column if not exists name text;

update public.identity
set name = nullif(
  trim(
    concat_ws(
      ' ',
      first_name,
      middle_name,
      last_name,
      extension
    )
  ),
  ''
)
where name is null;

alter table public.identity
  drop column if exists zip_code,
  drop column if exists first_name,
  drop column if exists middle_name,
  drop column if exists last_name,
  drop column if exists extension;

-- Normalize known legacy role labels before enum cast.
update public.designation
set job_title = case lower(trim(job_title))
  when 'program chairperson' then 'Program Chairperson'
  when 'program chair' then 'Program Chair'
  when 'campus director' then 'Campus Director'
  when 'university president' then 'University President'
  when 'director for instruction' then 'Director for Instruction'
  when 'college dean' then 'College Dean'
  else trim(job_title)
end
where job_title is not null;

alter table public.designation
  alter column job_title type public.designation_title_enum
  using trim(job_title)::public.designation_title_enum;

-- Normalize degree levels before enum cast.
update public.degree
set academic_level = case lower(trim(academic_level))
  when 'bachelor' then 'Bachelor''s Degree'
  when 'bachelors' then 'Bachelor''s Degree'
  when 'bachelor''s' then 'Bachelor''s Degree'
  when 'bachelor degree' then 'Bachelor''s Degree'
  when 'bachelor''s degree' then 'Bachelor''s Degree'
  when 'master' then 'Master''s Degree'
  when 'masters' then 'Master''s Degree'
  when 'master''s' then 'Master''s Degree'
  when 'master degree' then 'Master''s Degree'
  when 'master''s degree' then 'Master''s Degree'
  when 'doctorate' then 'Doctorate Degree'
  when 'doctoral' then 'Doctorate Degree'
  when 'doctorate degree' then 'Doctorate Degree'
  else academic_level
end
where academic_level is not null;

alter table public.degree
  drop column if exists degree_type,
  drop column if exists field_of_study,
  drop column if exists middle_name,
  alter column academic_level type public.academic_level_enum
  using trim(academic_level)::public.academic_level_enum;