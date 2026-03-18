do $$
begin
  create type public.day_of_week_enum as enum (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  );
exception
  when duplicate_object then
    null;
end
$$;