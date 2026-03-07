create or replace function public.get_user_roles()
returns text[]
language sql
security definer
set search_path = public, auth
as $$
  with designation_roles as (
    select distinct
      case
        when d.job_title::text in (
          'University President',
          'Director for Instruction',
          'College Dean',
          'Campus Director',
          'Program Chairperson'
        )
          then d.job_title::text
        else null
      end as role
    from public.designation d
    where d.user_id = auth.uid()
  ),
  admin_role as (
    select
      case
        when upper(coalesce(au.raw_user_meta_data ->> 'user_role', '')) = 'ADMIN'
          then 'Admin'
        else null
      end as role
    from auth.users au
    where au.id = auth.uid()
  ),
  base_role as (
    select 'Faculty'::text as role
    from public."user" u
    where u.id = auth.uid()
  ),
  all_roles as (
    select role from base_role
    union
    select role from designation_roles where role is not null
    union
    select role from admin_role where role is not null
  )
  select coalesce(array_agg(role order by role), array[]::text[])
  from all_roles;
$$;
