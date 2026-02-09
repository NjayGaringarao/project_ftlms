DROP FUNCTION IF EXISTS public.is_admin_exists();

CREATE OR REPLACE FUNCTION public.is_admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE raw_user_meta_data ->> 'user_role' = 'ADMIN'
  );
$$;