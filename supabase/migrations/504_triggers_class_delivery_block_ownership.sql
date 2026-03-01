create or replace function public.enforce_class_delivery_block_ownership()
returns trigger
language plpgsql
as $$
declare
  incoming_term_id uuid;
  incoming_course_offering_id uuid;
  incoming_user_id uuid;
begin
  select
    s.academic_term_id,
    ca.course_offering_id,
    s.user_id
  into
    incoming_term_id,
    incoming_course_offering_id,
    incoming_user_id
  from public.class_delivery cd
  join public.course_allocation ca
    on ca.id = cd.course_allocation_id
  join public.schedule s
    on s.id = ca.schedule_id
  where cd.id = new.class_delivery_id;

  if incoming_term_id is null
    or incoming_course_offering_id is null
    or incoming_user_id is null
  then
    raise exception 'Unable to resolve class delivery schedule context for id: %', new.class_delivery_id;
  end if;

  if exists (
    select 1
    from public.class_delivery_block cdb
    join public.class_delivery cd
      on cd.id = cdb.class_delivery_id
    join public.course_allocation ca
      on ca.id = cd.course_allocation_id
    join public.schedule s
      on s.id = ca.schedule_id
    where cdb.block_id = new.block_id
      and ca.course_offering_id = incoming_course_offering_id
      and s.academic_term_id = incoming_term_id
      and s.user_id <> incoming_user_id
      and cdb.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) then
    raise exception
      using
        errcode = '23505',
        message = 'duplicate key value violates unique ownership for block-course-term assignment',
        detail = 'This block-course-term is already assigned to a different instructor.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_class_delivery_block_ownership on public.class_delivery_block;
create trigger trg_enforce_class_delivery_block_ownership
before insert or update of class_delivery_id, block_id
on public.class_delivery_block
for each row
execute function public.enforce_class_delivery_block_ownership();
