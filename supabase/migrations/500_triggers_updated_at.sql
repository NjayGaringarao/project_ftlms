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

drop trigger if exists trg_schedule_set_updated_at on public.schedule;
create trigger trg_schedule_set_updated_at
before update on public.schedule
for each row
execute function public.set_updated_at();
