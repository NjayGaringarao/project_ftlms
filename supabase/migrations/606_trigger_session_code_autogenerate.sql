-- =========================================================
-- TRIGGER: Auto-generate session code on insert
-- Format: {class.code}-S{NNN} (e.g. CS101-S001)
-- The counter is scoped per class.
-- =========================================================

create or replace function public.generate_session_code()
returns trigger
language plpgsql
as $$
declare
  v_class_code text;
  v_next_n     integer;
begin
  -- Fetch the parent class code
  select code
    into v_class_code
  from public.class
  where id = new.class_id;

  if v_class_code is null then
    raise exception 'Invalid class_id: no matching class found';
  end if;

  -- Count existing sessions for this class to derive the next sequence number
  select count(*) + 1
    into v_next_n
  from public.session
  where class_id = new.class_id;

  new.code := v_class_code || '-S' || lpad(v_next_n::text, 3, '0');

  return new;
end;
$$;

drop trigger if exists trg_session_generate_code on public.session;

create trigger trg_session_generate_code
before insert
on public.session
for each row
execute function public.generate_session_code();
