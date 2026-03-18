-- =========================================================
-- TRIGGER: Block class term changes (schedule switch across terms)
-- =========================================================

create or replace function public.block_class_term_change()
returns trigger
language plpgsql
as $$
declare
  v_old_term_id uuid;
  v_new_term_id uuid;
begin
  if new.schedule_id is distinct from old.schedule_id then
    select academic_term_id
      into v_old_term_id
    from public.schedule
    where id = old.schedule_id;

    select academic_term_id
      into v_new_term_id
    from public.schedule
    where id = new.schedule_id;

    if v_old_term_id is null or v_new_term_id is null then
      raise exception 'Invalid schedule reference when updating class';
    end if;

    if v_old_term_id <> v_new_term_id then
      raise exception 'Class academic term change is not allowed';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_class_block_term_change on public.class;

create trigger trg_class_block_term_change
before update of schedule_id
on public.class
for each row
execute function public.block_class_term_change();
