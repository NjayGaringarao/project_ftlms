create or replace function public.is_admin_exists()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where raw_user_meta_data ->> 'user_role' = 'ADMIN'
  );
$$;
