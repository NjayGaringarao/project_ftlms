-- ======================================================================================
-- Purpose: support multiple attachments per campus-college-load evaluation.
-- Scope: new join table; legacy singular attachment_* columns on
--   campus_college_load_evaluation stay untouched for old rows. New
--   evaluations leave those columns null and use this table instead.
-- ======================================================================================

create table if not exists public.campus_college_load_evaluation_attachment (
  id uuid primary key default gen_random_uuid(),
  campus_college_load_evaluation_id uuid not null references public.campus_college_load_evaluation(id) on delete cascade,
  attachment_bucket text not null,
  attachment_path text not null,
  attachment_file_name text not null,
  attachment_mime_type text,
  created_at timestamptz not null default now()
);

create index if not exists idx_campus_college_load_evaluation_attachment_evaluation
  on public.campus_college_load_evaluation_attachment (campus_college_load_evaluation_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campus_college_load_evaluation_attachment_bucket_check'
      and conrelid = 'public.campus_college_load_evaluation_attachment'::regclass
  ) then
    alter table public.campus_college_load_evaluation_attachment
      add constraint campus_college_load_evaluation_attachment_bucket_check
      check (attachment_bucket = 'ftl-evaluation-return-attachment');
  end if;
end;
$$;
