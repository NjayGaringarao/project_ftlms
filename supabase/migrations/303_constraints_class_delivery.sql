do $$
begin
  -- One delivered class per course allocation.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_delivery_course_allocation_unique'
      and conrelid = 'public.class_delivery'::regclass
  ) then
    alter table public.class_delivery
      add constraint class_delivery_course_allocation_unique
      unique (course_allocation_id);
  end if;

  -- Prevent duplicate block links within a delivery.
  if not exists (
    select 1 from pg_constraint
    where conname = 'class_delivery_block_unique'
      and conrelid = 'public.class_delivery_block'::regclass
  ) then
    alter table public.class_delivery_block
      add constraint class_delivery_block_unique
      unique (class_delivery_id, block_id);
  end if;

  -- Conflict mode is warning-first. Remove hard slot uniqueness on session.
  if exists (
    select 1 from pg_constraint
    where conname = 'session_room_slot_unique'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      drop constraint session_room_slot_unique;
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'session_class_slot_unique'
      and conrelid = 'public.session'::regclass
  ) then
    alter table public.session
      drop constraint session_class_slot_unique;
  end if;
end;
$$;

create index if not exists class_delivery_schedule_idx
  on public.course_allocation (schedule_id);

create index if not exists course_allocation_course_offering_idx
  on public.course_allocation (course_offering_id);

create index if not exists class_delivery_block_block_idx
  on public.class_delivery_block (block_id);

create index if not exists session_room_timeslot_idx
  on public.session (room_id, day, start_time, end_time);

create index if not exists session_class_delivery_timeslot_idx
  on public.session (class_delivery_id, day, start_time, end_time);
