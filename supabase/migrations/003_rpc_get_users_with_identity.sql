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
    COALESCE(
      json_agg(
        json_build_object(
          'id', d.id,
          'user_id', d.user_id,
          'campus_id', d.campus_id,
          'job_title', d.job_title,
          'department_id', d.department_id,
          'program_id', d.program_id,
          'room_id', d.room_id,
          'load', d.load,
          'is_active', d.is_active,
          'designated_at', d.designated_at,
          'campus', json_build_object(
            'id', c.id,
            'name', c.name
          ),
          'department', CASE
            WHEN dep.id IS NULL THEN NULL
            ELSE json_build_object(
              'id', dep.id,
              'code', dep.code,
              'name', dep.name,
              'type', dep.type
            )
          END
        ) ORDER BY d.id DESC
      ) FILTER (WHERE d.id IS NOT NULL),
      '[]'::json
    ) AS designations,
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
  FROM public."user" u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.identity i ON i.user_id = u.id
  LEFT JOIN public.academic_rank r ON r.id = u.academic_rank_id
  LEFT JOIN public.designation d ON d.user_id = u.id
  LEFT JOIN public.campus c ON c.id = d.campus_id
  LEFT JOIN public.department dep ON dep.id = d.department_id
  LEFT JOIN public.degree deg ON deg.user_id = u.id
  WHERE filter_user_id IS NULL OR u.id = filter_user_id
  GROUP BY
    u.id, au.email, u.employment_status, r.id, r.number, r.title, r.description,
    i.user_id, i.first_name, i.middle_name, i.last_name, i.extension,
    i.birth_date, i.address, i.zip_code, i.contact_number
  ORDER BY
    u.employment_status ASC NULLS LAST,
    i.last_name ASC NULLS LAST,
    i.first_name ASC NULLS LAST;
$$;
