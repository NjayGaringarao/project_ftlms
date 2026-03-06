do $$
begin
  create type public.evaluation_status_enum as enum (
    'PENDING',
    'APPROVED',
    'REJECTED'
  );
exception
  when duplicate_object then
    null;
end
$$;
