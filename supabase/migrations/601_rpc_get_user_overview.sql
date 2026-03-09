create or replace function public.get_user_overview(filter_user_id uuid default null)
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  account_created_at timestamptz,
  last_sign_in_at timestamptz,
  account_type text,
  employment_status text,
  academic_rank_id uuid,
  academic_rank_code text,
  academic_rank_title text,
  academic_rank_description text,
  identity jsonb,
  designations jsonb,
  degrees jsonb,
  current_term jsonb,
  classes jsonb,
  actual_teaching_load numeric
)
language sql
security definer
set search_path = public, auth
as $$
  with current_term as (
    select
      at.id,
      at.code,
      at.academic_year_start,
      at.academic_year_end,
      at.term_order,
      at.type,
      at.start,
      at."end"
    from public.academic_term at
    where current_date between at.start and at."end"
    order by at.start desc
    limit 1
  ),
  user_designations as (
    select
      d.user_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', d.id,
            'user_id', d.user_id,
            'campus_id', d.campus_id,
            'college_id', d.college_id,
            'program_offering_id', d.program_offering_id,
            'room_id', d.room_id,
            'job_title', d.job_title,
            'position', d.job_title,
            'load', d.load,
            'designated_at', d.designated_at,
            'campus', case
              when c.id is null then null
              else jsonb_build_object(
                'id', c.id,
                'code', c.code,
                'name', c.name,
                'address', c.address
              )
            end,
            'college', case
              when col.id is null then null
              else jsonb_build_object(
                'id', col.id,
                'code', col.code,
                'name', col.name,
                'description', col.description
              )
            end,
            'program', case
              when p.id is null then null
              else jsonb_build_object(
                'id', p.id,
                'college_id', p.college_id,
                'code', p.code,
                'name', p.name,
                'description', p.description
              )
            end,
            'program_offering', case
              when po.id is null then null
              else jsonb_build_object(
                'id', po.id,
                'campus_id', po.campus_id,
                'program_id', po.program_id,
                'campus', case
                  when po_c.id is null then null
                  else jsonb_build_object(
                    'id', po_c.id,
                    'code', po_c.code,
                    'name', po_c.name,
                    'address', po_c.address
                  )
                end,
                'program', case
                  when p.id is null then null
                  else jsonb_build_object(
                    'id', p.id,
                    'college_id', p.college_id,
                    'code', p.code,
                    'name', p.name,
                    'description', p.description
                  )
                end
              )
            end
          )
          order by d.job_title asc, d.id desc
        ) filter (where d.id is not null),
        '[]'::jsonb
      ) as designations
    from public.designation d
    left join public.campus c on c.id = d.campus_id
    left join public.college col on col.id = d.college_id
    left join public.program_offering po on po.id = d.program_offering_id
    left join public.campus po_c on po_c.id = po.campus_id
    left join public.program p on p.id = po.program_id
    group by d.user_id
  ),
  user_degrees as (
    select
      deg.user_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', deg.id,
            'user_id', deg.user_id,
            'academic_level', deg.academic_level,
            'title', deg.title,
            'year_graduated', deg.year_graduated,
            'institution', deg.institution,
            'country_code', deg.country_code,
            'created_at', deg.created_at,
            'updated_at', deg.updated_at
          )
          order by deg.year_graduated desc nulls last, deg.created_at desc
        ) filter (where deg.id is not null),
        '[]'::jsonb
      ) as degrees
    from public.degree deg
    group by deg.user_id
  ),
  user_schedule as (
    select
      s.user_id,
      s.id as schedule_id
    from public.schedule s
    join current_term ct on ct.id = s.academic_term_id
  ),
  class_rows as (
    select
      us.user_id,
      cls.id,
      cls.code as class_code,
      c.code as course_code,
      c.title as course_title,
      coalesce(c.lecture_unit, 0) as lecture_unit,
      coalesce(c.laboratory_unit, 0) as laboratory_unit,
      coalesce(
        string_agg(
          distinct concat_ws(' - ', b.year_level::text, b.section),
          ', '
        ) filter (where b.id is not null),
        'Not assigned'
      ) as year_section,
      coalesce(
        string_agg(
          distinct campus.name,
          ', '
        ) filter (where campus.id is not null),
        'Not assigned'
      ) as campus_name
    from user_schedule us
    join public.class cls on cls.schedule_id = us.schedule_id
    join public.course c on c.id = cls.course_id
    left join public.class_block cb on cb.class_id = cls.id
    left join public.block b on b.id = cb.block_id
    left join public.major_offering mo on mo.id = b.major_offering_id
    left join public.program_offering po on po.id = mo.program_offering_id
    left join public.campus campus on campus.id = po.campus_id
    group by
      us.user_id,
      cls.id,
      cls.code,
      c.code,
      c.title,
      c.lecture_unit,
      c.laboratory_unit
  ),
  user_class_load as (
    select
      cr.user_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', cr.id,
            'class_code', cr.class_code,
            'course_code', cr.course_code,
            'course_title', cr.course_title,
            'lecture_unit', cr.lecture_unit,
            'laboratory_unit', cr.laboratory_unit,
            'year_section', cr.year_section,
            'campus_name', cr.campus_name
          )
          order by cr.course_code asc
        ),
        '[]'::jsonb
      ) as classes
    from class_rows cr
    group by cr.user_id
  )
  select
    u.id,
    au.email,
    au.email_confirmed_at,
    au.created_at as account_created_at,
    au.last_sign_in_at,
    case
      when upper(coalesce(au.raw_user_meta_data ->> 'user_role', '')) = 'ADMIN'
        then 'Admin'
      else 'User'
    end as account_type,
    u.employment_status::text,
    r.id as academic_rank_id,
    r.code as academic_rank_code,
    r.title as academic_rank_title,
    r.description as academic_rank_description,
    case
      when i.user_id is null then null
      else jsonb_build_object(
        'user_id', i.user_id,
        'name', i.name,
        'birth_date', i.birth_date,
        'address', i.address,
        'contact_number', i.contact_number
      )
    end as identity,
    coalesce(ud.designations, '[]'::jsonb) as designations,
    coalesce(udeg.degrees, '[]'::jsonb) as degrees,
    case
      when ct.id is null then null
      else jsonb_build_object(
        'id', ct.id,
        'code', ct.code,
        'academic_year_start', ct.academic_year_start,
        'academic_year_end', ct.academic_year_end,
        'term_order', ct.term_order,
        'type', ct.type,
        'start', ct.start,
        'end', ct."end"
      )
    end as current_term,
    coalesce(ucl.classes, '[]'::jsonb) as classes,
    0::numeric as actual_teaching_load
  from public."user" u
  left join auth.users au on au.id = u.id
  left join public.identity i on i.user_id = u.id
  left join public.academic_rank r on r.id = u.academic_rank_id
  left join current_term ct on true
  left join user_designations ud on ud.user_id = u.id
  left join user_degrees udeg on udeg.user_id = u.id
  left join user_class_load ucl on ucl.user_id = u.id
  where filter_user_id is null or u.id = filter_user_id
  order by
    u.employment_status asc nulls last,
    i.name asc nulls last;
$$;