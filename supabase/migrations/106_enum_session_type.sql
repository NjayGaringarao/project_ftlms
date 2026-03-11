do $$
begin
  create type public.session_type_enum as enum (
    'Lecture',
    'Laboratory'
  );
exception
  when duplicate_object then
    null;
end
$$;