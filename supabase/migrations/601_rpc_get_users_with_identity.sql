create or replace function public.get_users_with_identity(filter_user_id uuid default null)
returns table (
  id uuid,
  email text,
  employment_status text,
  academic_rank_id text,
  academic_rank_number integer,
  academic_rank_title text,
  academic_rank_description text,
  identity_user_id uuid,
  first_name text,
  middle_name text,
  last_name text,
  extension text,
  birth_date date,
  address text,
  zip_code text,
  contact_number text,
  designations json,
  degrees json
)
language sql
security definer
set search_path = public, auth
as $$
  with user_designations as (
    select
      d.user_id,
      coalesce(
        json_agg(
          json_build_object(
            'id', d.id,
            'user_id', d.user_id,
            'campus_id', d.campus_id,
            'job_title', d.job_title,
            'department_id', d.department_id,
            'program_campus_id', d.program_campus_id,
            'room_id', d.room_id,
            'load', d.load,
            'designated_at', d.designated_at,
            'user', json_build_object(
              'id', u.id,
              'email', au.email,
              'employment_status', u.employment_status
            ),
            'campus', case
              when coalesce(c.id, pc_c.id) is null then null
              else json_build_object(
                'id', coalesce(c.id, pc_c.id),
                'name', coalesce(c.name, pc_c.name)
              )
            end,
            'department', case
              when dep.id is null then null
              else json_build_object(
                'id', dep.id,
                'code', dep.code,
                'name', dep.name,
                'type', dep.type
              )
            end,
            'program', case
              when prog.id is null then null
              else json_build_object(
                'id', prog.id,
                'code', prog.code,
                'name', prog.name
              )
            end,
            'program_campus', case
              when pc.id is null then null
              else json_build_object(
                'id', pc.id,
                'campus_id', pc.campus_id,
                'program_id', pc.program_id
              )
            end
          )
          order by d.id desc
        ) filter (where d.id is not null),
        '[]'::json
      ) as designations
    from public.designation d
    left join public."user" u on u.id = d.user_id
    left join auth.users au on au.id = d.user_id
    left join public.campus c on c.id = d.campus_id
    left join public.department dep on dep.id = d.department_id
    left join public.program_campus pc on pc.id = d.program_campus_id
    left join public.campus pc_c on pc_c.id = pc.campus_id
    left join public.program prog on prog.id = pc.program_id
    group by d.user_id
  ),
  user_degrees as (
    select
      deg.user_id,
      coalesce(
        json_agg(
          json_build_object(
            'id', deg.id,
            'user_id', deg.user_id,
            'academic_level', deg.academic_level,
            'degree_type', deg.degree_type,
            'field_of_study', deg.field_of_study,
            'year_graduated', deg.year_graduated,
            'institution', deg.institution,
            'country_code', deg.country_code
          )
          order by deg.year_graduated desc, deg.created_at desc
        ) filter (where deg.id is not null),
        '[]'::json
      ) as degrees
    from public.degree deg
    group by deg.user_id
  )
  select
    u.id,
    au.email,
    u.employment_status,
    r.id::text as academic_rank_id,
    r.number as academic_rank_number,
    r.title as academic_rank_title,
    r.description as academic_rank_description,
    i.user_id as identity_user_id,
    i.first_name,
    i.middle_name,
    i.last_name,
    i.extension,
    i.birth_date,
    i.address,
    i.zip_code,
    i.contact_number,
    coalesce(ud.designations, '[]'::json) as designations,
    coalesce(udeg.degrees, '[]'::json) as degrees
  from public."user" u
  left join auth.users au on au.id = u.id
  left join public.identity i on i.user_id = u.id
  left join public.academic_rank r on r.id = u.academic_rank_id
  left join user_designations ud on ud.user_id = u.id
  left join user_degrees udeg on udeg.user_id = u.id
  where filter_user_id is null or u.id = filter_user_id
  order by
    u.employment_status asc nulls last,
    i.last_name asc nulls last,
    i.first_name asc nulls last;
$$;
