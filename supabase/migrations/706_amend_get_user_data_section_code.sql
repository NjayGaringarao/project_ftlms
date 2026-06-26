-- =========================================================
-- AMEND: get_user_data — replace year_section with section_code
-- Uses the trigger-generated section.code (e.g. "BSCS GEN 4-A")
-- instead of the old concat_ws(year_level, name) format.
-- =========================================================

create or replace function public.get_user_data(
  filter_user_id uuid default null,
  academic_term_id uuid default null,
  include_degrees boolean default false,
  include_designations boolean default false,
  include_classes boolean default false,
  include_loads boolean default false
)
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamptz,
  account_created_at timestamptz,
  last_sign_in_at timestamptz,
  account_type text,
  employment_status text,
  campus_id uuid,
  college_id uuid,
  campus jsonb,
  college jsonb,
  academic_rank_id uuid,
  academic_rank_code text,
  academic_rank_title text,
  academic_rank_description text,
  identity jsonb,
  designations jsonb,
  degrees jsonb,
  current_term jsonb,
  classes jsonb,
  actual_teaching_load numeric,
  designation_load numeric,
  total_working_load numeric
)
language sql
security definer
set search_path = public, auth
as $$
  with requested_term as (
    select
      at.id,
      at.code,
      at.academic_year_id,
      ay.code as academic_year_code,
      ay.start_year as academic_year_start,
      ay.end_year as academic_year_end,
      at.name,
      at.start,
      at."end"
    from public.academic_term at
    join public.academic_year ay on ay.id = at.academic_year_id
    where at.id = academic_term_id
    limit 1
  ),
  current_term as (
    select
      at.id,
      at.code,
      at.academic_year_id,
      ay.code as academic_year_code,
      ay.start_year as academic_year_start,
      ay.end_year as academic_year_end,
      at.name,
      at.start,
      at."end"
    from public.academic_term at
    join public.academic_year ay on ay.id = at.academic_year_id
    where current_date between at.start and at."end"
    order by at.start desc
    limit 1
  ),
  selected_term as (
    select * from requested_term
    union all
    select * from current_term
    where not exists (select 1 from requested_term)
  ),
  class_rows as (
    select
      uc.user_id,
      cls.id,
      cls.code as class_code,
      co.code as course_code,
      co.title as course_title,
      coalesce(co.lecture_unit, 0) as lecture_unit,
      coalesce(co.laboratory_unit, 0) as laboratory_unit,
      coalesce(
        string_agg(
          distinct b.code,
          ', '
        ) filter (where b.id is not null),
        'Not assigned'
      ) as section_code,
      coalesce(
        string_agg(
          distinct campus.name,
          ', '
        ) filter (where campus.id is not null),
        'Not assigned'
      ) as campus_name
    from public.user_class uc
    join public.class cls on cls.id = uc.class_id
    join public.course_utilization cu on cu.class_id = cls.id
    join public.course co on co.id = cu.course_id
    join public.section b on b.id = cu.section_id
    join selected_term st on st.id = b.academic_term_id
    left join public.major_offering mo on mo.id = b.major_offering_id
    left join public.program_offering po on po.id = mo.program_offering_id
    left join public.campus campus on campus.id = po.campus_id
    where include_classes or include_loads
    group by
      uc.user_id,
      cls.id,
      cls.code,
      co.code,
      co.title,
      co.lecture_unit,
      co.laboratory_unit
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
            'section_code', cr.section_code,
            'campus_name', cr.campus_name
          )
          order by cr.course_code asc
        ),
        '[]'::jsonb
      ) as classes
    from class_rows cr
    group by cr.user_id
  ),
  class_loads as (
    select
      cr.user_id,
      sum(cr.lecture_unit + (cr.laboratory_unit * 3) * 0.75) as actual_teaching_load
    from class_rows cr
    group by cr.user_id
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
    where include_designations
    group by d.user_id
  ),
  designation_loads as (
    select
      d.user_id,
      sum(coalesce(d.load, 0)) as designation_load
    from public.designation d
    where include_loads
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
    where include_degrees
    group by deg.user_id
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
    u.campus_id,
    u.college_id,
    case
      when uc.id is null then null
      else jsonb_build_object(
        'id', uc.id,
        'code', uc.code,
        'name', uc.name,
        'address', uc.address
      )
    end as campus,
    case
      when ucol.id is null then null
      else jsonb_build_object(
        'id', ucol.id,
        'code', ucol.code,
        'name', ucol.name,
        'description', ucol.description
      )
    end as college,
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
    case
      when include_designations then coalesce(ud.designations, '[]'::jsonb)
      else '[]'::jsonb
    end as designations,
    case
      when include_degrees then coalesce(udeg.degrees, '[]'::jsonb)
      else '[]'::jsonb
    end as degrees,
    case
      when st.id is null then null
      else jsonb_build_object(
        'id', st.id,
        'code', st.code,
        'academic_year_id', st.academic_year_id,
        'academic_year_code', st.academic_year_code,
        'academic_year_start', st.academic_year_start,
        'academic_year_end', st.academic_year_end,
        'name', st.name,
        'start', st.start,
        'end', st."end"
      )
    end as current_term,
    case
      when include_classes then coalesce(ucl.classes, '[]'::jsonb)
      else '[]'::jsonb
    end as classes,
    case
      when include_loads then coalesce(cl.actual_teaching_load, 0)
      else null
    end as actual_teaching_load,
    case
      when include_loads then coalesce(dl.designation_load, 0)
      else null
    end as designation_load,
    case
      when include_loads then coalesce(cl.actual_teaching_load, 0) + coalesce(dl.designation_load, 0)
      else null
    end as total_working_load
  from public."user" u
  left join auth.users au on au.id = u.id
  left join public.identity i on i.user_id = u.id
  left join public.academic_rank r on r.id = u.academic_rank_id
  left join public.campus uc on uc.id = u.campus_id
  left join public.college ucol on ucol.id = u.college_id
  left join selected_term st on true
  left join user_designations ud on ud.user_id = u.id
  left join user_degrees udeg on udeg.user_id = u.id
  left join user_class_load ucl on ucl.user_id = u.id
  left join class_loads cl on cl.user_id = u.id
  left join designation_loads dl on dl.user_id = u.id
  where filter_user_id is null or u.id = filter_user_id
  order by
    u.employment_status asc nulls last,
    i.name asc nulls last;
$$;
