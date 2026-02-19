DROP FUNCTION IF EXISTS public.get_users_with_identity(uuid);

CREATE OR REPLACE FUNCTION public.get_users_with_identity(filter_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  employment_status text,
  rank_id text,
  rank_number integer,
  rank_title text,
  rank_description text,
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
    r.id AS rank_id,
    r.number AS rank_number,
    r.title AS rank_title,
    r.description AS rank_description,
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
          'position', d.position,
          'department', d.department,
          'load', d.load,
          'campus', json_build_object(
            'id', c.id,
            'name', c.name
          )
        ) ORDER BY d.created_at DESC
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
  LEFT JOIN public.rank r ON r.id = u.rank_id
  LEFT JOIN public.designation d ON d.user_id = u.id
  LEFT JOIN public.campus c ON c.id = d.campus_id
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
