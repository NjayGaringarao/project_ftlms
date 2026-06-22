do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_attachment_pdf_check'
      and conrelid = 'public.campus_college_load_evaluation'::regclass
  ) then
    alter table public.campus_college_load_evaluation
      drop constraint campus_college_load_attachment_pdf_check;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_attachment_bucket_check'
      and conrelid = 'public.campus_college_load_evaluation'::regclass
  ) then
    alter table public.campus_college_load_evaluation
      add constraint campus_college_load_attachment_bucket_check
      check (
        attachment_path is null
        or attachment_bucket = 'ftl-evaluation-return-attachment'
      );
  end if;
end;
$$;
