create or replace function public.get_user_roles()
returns text[]
language sql
security definer
set search_path = public, auth
as $$
  with designation_roles as (
    select distinct
      case
        when lower(trim(d.job_title::text)) in ('university president', 'director for instruction')
          then 'HIGHER-UPS'
        when lower(trim(d.job_title::text)) = 'program chairperson'
          then 'PROGRAM_CHAIRPERSON'
        when lower(trim(d.job_title::text)) = 'campus director'
          then 'CAMPUS_DIRECTOR'
        else null
      end as role
    from public.designation d
    where d.user_id = auth.uid()
  ),
  admin_role as (
    select
      case
        when au.raw_user_meta_data ->> 'user_role' = 'ADMIN'
          then 'ADMIN'
        else null
      end as role
    from auth.users au
    where au.id = auth.uid()
  ),
  base_role as (
    select 'FACULTY'::text as role
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
  select coalesce(array_agg(role), array[]::text[])
  from all_roles;
$$;
