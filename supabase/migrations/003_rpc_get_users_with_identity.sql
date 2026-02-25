DROP FUNCTION IF EXISTS public.get_users_with_identity(uuid);

CREATE OR REPLACE FUNCTION public.get_users_with_identity(filter_user_id uuid DEFAULT NULL)
RETURNS TABLE (
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH user_designations AS (
    -- Aggregate designations separately to avoid cartesian product
    SELECT
      d.user_id,
      COALESCE(
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
            'campus', CASE
              WHEN COALESCE(c.id, pc_c.id) IS NULL THEN NULL
              ELSE json_build_object(
                'id', COALESCE(c.id, pc_c.id),
                'name', COALESCE(c.name, pc_c.name)
              )
            END,
            'department', CASE
              WHEN dep.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', dep.id,
                'code', dep.code,
                'name', dep.name,
                'type', dep.type
              )
            END,
            'program', CASE
              WHEN prog.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', prog.id,
                'code', prog.code,
                'name', prog.name
              )
            END,
            'program_campus', CASE
              WHEN pc.id IS NULL THEN NULL
              ELSE json_build_object(
                'id', pc.id,
                'campus_id', pc.campus_id,
                'program_id', pc.program_id
              )
            END
          ) ORDER BY d.id DESC
        ) FILTER (WHERE d.id IS NOT NULL),
        '[]'::json
      ) AS designations
    FROM public.designation d
    LEFT JOIN public."user" u ON u.id = d.user_id
    LEFT JOIN auth.users au ON au.id = d.user_id
    LEFT JOIN public.campus c ON c.id = d.campus_id
    LEFT JOIN public.department dep ON dep.id = d.department_id
    LEFT JOIN public.program_campus pc ON pc.id = d.program_campus_id
    LEFT JOIN public.campus pc_c ON pc_c.id = pc.campus_id
    LEFT JOIN public.program prog ON prog.id = pc.program_id
    GROUP BY d.user_id
  ),
  user_degrees AS (
    -- Aggregate degrees separately to avoid cartesian product
    SELECT
      deg.user_id,
      COALESCE(
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
          ) ORDER BY deg.year_graduated DESC, deg.created_at DESC
        ) FILTER (WHERE deg.id IS NOT NULL),
        '[]'::json
      ) AS degrees
    FROM public.degree deg
    GROUP BY deg.user_id
  )
  SELECT
    u.id,
    au.email,
    u.employment_status,
    r.id AS academic_rank_id,
    r.number AS academic_rank_number,
    r.title AS academic_rank_title,
    r.description AS academic_rank_description,
    i.user_id AS identity_user_id,
    i.first_name,
    i.middle_name,
    i.last_name,
    i.extension,
    i.birth_date,
    i.address,
    i.zip_code,
    i.contact_number,
    COALESCE(ud.designations, '[]'::json) AS designations,
    COALESCE(udeg.degrees, '[]'::json) AS degrees
  FROM public."user" u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.identity i ON i.user_id = u.id
  LEFT JOIN public.academic_rank r ON r.id = u.academic_rank_id
  LEFT JOIN user_designations ud ON ud.user_id = u.id
  LEFT JOIN user_degrees udeg ON udeg.user_id = u.id
  WHERE filter_user_id IS NULL OR u.id = filter_user_id
  ORDER BY
    u.employment_status ASC NULLS LAST,
    i.last_name ASC NULLS LAST,
    i.first_name ASC NULLS LAST;
$$;
