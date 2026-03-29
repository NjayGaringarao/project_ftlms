create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_degree_set_updated_at on public.degree;
create trigger trg_degree_set_updated_at
before update on public.degree
for each row
execute function public.set_updated_at();

drop trigger if exists trg_class_set_updated_at on public.class;
create trigger trg_class_set_updated_at
before update on public.class
for each row
execute function public.set_updated_at();

drop trigger if exists trg_faculty_load_proposal_set_updated_at on public.faculty_load_proposal;
create trigger trg_faculty_load_proposal_set_updated_at
before update on public.faculty_load_proposal
for each row
execute function public.set_updated_at();

drop trigger if exists trg_campus_load_set_updated_at on public.campus_load;
create trigger trg_campus_load_set_updated_at
before update on public.campus_load
for each row
execute function public.set_updated_at();

drop trigger if exists trg_document_export_job_set_updated_at on public.document_export_job;
create trigger trg_document_export_job_set_updated_at
before update on public.document_export_job
for each row
execute function public.set_updated_at();
