do $$
begin
  -- Allow multiple class deliveries under one course allocation.
  if exists (
    select 1 from pg_constraint
    where conname = 'class_delivery_course_allocation_unique'
      and conrelid = 'public.class_delivery'::regclass
  ) then
    alter table public.class_delivery
      drop constraint class_delivery_course_allocation_unique;
  end if;
end;
$$;
