do $$
begin
  create type public.department_type_enum as enum (
    'ACADEMIC',
    'ADMINISTRATIVE',
    'STUDENT_SERVICES',
    'EXTENSION_SERVICES'
  );
exception
  when duplicate_object then
    null;
end
$$;
