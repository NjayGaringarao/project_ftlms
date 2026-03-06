do $$
begin
  create type public.employment_status_enum as enum (
    'Regular',
    'Part-time',
    'Contract of Service',
    'Temporary'
  );
exception
  when duplicate_object then
    null;
end
$$;
