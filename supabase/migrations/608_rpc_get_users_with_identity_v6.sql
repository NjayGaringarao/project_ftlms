-- =========================================================
-- RPC (V6): USERS WITH IDENTITY
-- Description:
--   Returns users with v6 identity, degree, and designation context.
-- =========================================================

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
  name text,
  birth_date date,
  address text,
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
            'college_id', d.college_id,
            'program_offering_id', d.program_offering_id,
            'room_id', d.room_id,
            'load', d.load,
            'designated_at', d.designated_at,
            'user', json_build_object(
              'id', u.id,
              'email', au.email,
              'employment_status', u.employment_status
            ),
            'campus', case
              when coalesce(c.id, po_c.id) is null then null
              else json_build_object(
                'id', coalesce(c.id, po_c.id),
                'name', coalesce(c.name, po_c.name)
              )
            end,
            'college', case
              when col.id is null then null
              else json_build_object(
                'id', col.id,
                'code', col.code,
                'name', col.name,
                'type', col.type
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
            'program_offering', case
              when po.id is null then null
              else json_build_object(
                'id', po.id,
                'campus_id', po.campus_id,
                'program_id', po.program_id
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
    left join public.college col on col.id = d.college_id
    left join public.program_offering po on po.id = d.program_offering_id
    left join public.campus po_c on po_c.id = po.campus_id
    left join public.program prog on prog.id = po.program_id
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
    u.employment_status::text,
    r.id::text as academic_rank_id,
    r.number as academic_rank_number,
    r.title as academic_rank_title,
    r.description as academic_rank_description,
    i.user_id as identity_user_id,
    i.name,
    i.birth_date,
    i.address,
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
    i.name asc nulls last;
$$;
