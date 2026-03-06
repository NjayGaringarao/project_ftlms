do $$
begin
  create type public.academic_terms_term_order as enum (
    'FIRST',
    'SECOND',
    'THIRD',
    'FOURTH'
  );
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create type public.day_of_week_enum as enum (
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
  );
exception
  when duplicate_object then
    null;
end
$$;
