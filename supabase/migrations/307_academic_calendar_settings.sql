create table if not exists public.app_setting (
  key text primary key,
  academic_term_id uuid references public.academic_term(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint app_setting_known_key_check
    check (key in ('default_academic_term_id'))
);

insert into public.app_setting (key, academic_term_id)
values ('default_academic_term_id', null)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'academic_term_no_global_date_overlap'
      and conrelid = 'public.academic_term'::regclass
  ) then
    alter table public.academic_term
      add constraint academic_term_no_global_date_overlap
      exclude using gist (daterange("start", "end", '[]') with &&);
  end if;
end;
$$;
