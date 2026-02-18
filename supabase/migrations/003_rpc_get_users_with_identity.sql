DROP FUNCTION IF EXISTS public.get_users_with_identity(uuid);

CREATE OR REPLACE FUNCTION public.get_users_with_identity(filter_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  email text,
  employment_status text,
  identity_user_id uuid,
  first_name text,
  middle_name text,
  last_name text,
  extension text,
  birth_date date,
  address text,
  zip_code text,
  contact_number text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    au.email,
    u.employment_status,
    i.user_id AS identity_user_id,
    i.first_name,
    i.middle_name,
    i.last_name,
    i.extension,
    i.birth_date,
    i.address,
    i.zip_code,
    i.contact_number
  FROM public."user" u
  LEFT JOIN auth.users au ON au.id = u.id
  LEFT JOIN public.identity i ON i.user_id = u.id
  WHERE filter_user_id IS NULL OR u.id = filter_user_id
  ORDER BY
    u.employment_status ASC NULLS LAST,
    i.last_name ASC NULLS LAST,
    i.first_name ASC NULLS LAST;
$$;
