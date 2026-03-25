do $$
begin
  create type public.individual_proposal_step_enum as enum (
    'CAMPUS_DIRECTOR'
  );
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create type public.campus_proposal_step_enum as enum (
    'DIRECTOR_FOR_INSTRUCTION',
    'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
  );
exception
  when duplicate_object then
    null;
end
$$;
