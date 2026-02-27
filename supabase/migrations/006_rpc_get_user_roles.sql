DROP FUNCTION IF EXISTS public.get_user_roles();

CREATE OR REPLACE FUNCTION public.get_user_roles()
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  WITH designation_roles AS (
    SELECT DISTINCT
      CASE
        WHEN lower(trim(d.job_title)) IN ('university president', 'director for instruction')
          THEN 'HIGHER-UPS'
        WHEN lower(trim(d.job_title)) = 'program chairperson'
          THEN 'PROGRAM_CHAIRPERSON'
        WHEN lower(trim(d.job_title)) = 'campus director'
          THEN 'CAMPUS_DIRECTOR'
        ELSE NULL
      END AS role
    FROM designation d
    WHERE d.user_id = auth.uid()
  ),
  admin_role AS (
    SELECT
      CASE
        WHEN au.raw_user_meta_data ->> 'user_role' = 'ADMIN'
          THEN 'ADMIN'
        ELSE NULL
      END AS role
    FROM auth.users au
    WHERE au.id = auth.uid()
  ),
  base_role AS (
    SELECT 'FACULTY'::text AS role
    FROM "user" u
    WHERE u.id = auth.uid()
  ),
  all_roles AS (
    SELECT role FROM base_role
    UNION
    SELECT role FROM designation_roles WHERE role IS NOT NULL
    UNION
    SELECT role FROM admin_role WHERE role IS NOT NULL
  )
  SELECT COALESCE(array_agg(role), ARRAY[]::text[])
  FROM all_roles;
$$;
