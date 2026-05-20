do $$
begin
  create type public.campus_college_load_status_enum as enum (
    'DRAFT',
    'SUBMITTED',
    'RETURNED',
    'APPROVED'
  );
exception
  when duplicate_object then
    null;
end
$$;
