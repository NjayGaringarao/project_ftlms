do $$
begin
  create type public.faculty_load_step_enum as enum (
    'CAMPUS_DIRECTOR'
  );
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create type public.campus_load_step_enum as enum (
    'DIRECTOR_FOR_INSTRUCTION',
    'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS'
  );
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create type public.document_export_job_status_enum as enum (
    'QUEUED',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
  );
exception
  when duplicate_object then
    null;
end
$$;
