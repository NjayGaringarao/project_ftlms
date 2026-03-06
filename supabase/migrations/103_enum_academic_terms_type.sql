do $$
begin
  create type public.academic_terms_type_enum as enum (
    'SEMESTER',
    'TRIMESTER',
    'QUARTER'
   );
exception
  when duplicate_object then
    null;
end
$$;
