do $$
begin
  create type public.academic_term_name as enum (
    'FIRST SEMESTER',
    'SECOND SEMESTER',
    'MIDYEAR'
  );
exception
  when duplicate_object then
    null;
end
$$;
