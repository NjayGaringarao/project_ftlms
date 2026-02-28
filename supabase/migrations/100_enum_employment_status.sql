do $$
begin
  create type public.employment_status_enum as enum ('FULL_TIME', 'PART_TIME');
exception
  when duplicate_object then
    null;
end
$$;
