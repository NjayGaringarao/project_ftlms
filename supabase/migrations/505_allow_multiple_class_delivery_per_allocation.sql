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

  -- Normalize class_delivery_block uniqueness to canonical name.
  if exists (
    select 1 from pg_constraint
    where conname = 'class_delivery_block_delivery_block_unique'
      and conrelid = 'public.class_delivery_block'::regclass
  ) then
    alter table public.class_delivery_block
      drop constraint class_delivery_block_delivery_block_unique;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'class_delivery_block_unique'
      and conrelid = 'public.class_delivery_block'::regclass
  ) then
    alter table public.class_delivery_block
      add constraint class_delivery_block_unique
      unique (class_delivery_id, block_id);
  end if;
end;
$$;
