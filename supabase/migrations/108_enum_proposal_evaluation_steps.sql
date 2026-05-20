do $$
begin
  create type public.campus_college_load_step_enum as enum (
    'PROGRAM_CHAIR',
    'CAMPUS_DIRECTOR',
    'DIRECTOR_FOR_INSTRUCTION',
    'VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS',
    'COMPLETED'
  );
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create type public.campus_college_load_evaluation_step_enum as enum (
    'CAMPUS_DIRECTOR',
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
  create type public.campus_college_load_evaluation_status_enum as enum (
    'APPROVED',
    'RETURNED'
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
