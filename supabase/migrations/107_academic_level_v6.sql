do $$
begin
  create type public.academic_level_enum as enum (
    'Bachelor''s Degree',
    'Master''s Degree',
    'Doctorate Degree'
  );
exception
  when duplicate_object then
    null;
end
$$;