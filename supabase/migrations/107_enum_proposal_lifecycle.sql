do $$
begin
  create type public.proposal_lifecycle_enum as enum (
    'ACTIVE',
    'APPROVED',
    'REJECTED',
    'INVALIDATED'
  );
exception
  when duplicate_object then
    null;
end
$$;
