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

drop trigger if exists trg_proposal_set_updated_at on public.proposal;
create trigger trg_proposal_set_updated_at
before update on public.proposal
for each row
execute function public.set_updated_at();

drop trigger if exists trg_campus_proposal_set_updated_at on public.campus_proposal;
create trigger trg_campus_proposal_set_updated_at
before update on public.campus_proposal
for each row
execute function public.set_updated_at();
