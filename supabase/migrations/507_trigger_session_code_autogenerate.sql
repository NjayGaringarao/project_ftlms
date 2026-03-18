-- =========================================================
-- TRIGGER: Auto-generate session code on insert
-- Format: S{A-Z}{NNN} (e.g. SA001)
-- The counter is scoped per academic term.
-- =========================================================

create or replace function public.generate_session_code()
returns trigger
language plpgsql
as $$
declare
  v_term_id    uuid;
  v_max_index  integer;
  v_next_index integer;
  v_letter_idx integer;
  v_number     integer;
  v_letter     text;
begin
  -- Fetch the academic term for this session via class -> schedule.
  select s.academic_term_id
    into v_term_id
  from public.class c
  join public.schedule s
    on s.id = c.schedule_id
  where c.id = new.class_id;

  if v_term_id is null then
    raise exception 'Invalid class_id: no matching class/schedule found';
  end if;

  -- Serialize code assignment per term to avoid race conditions.
  perform pg_advisory_xact_lock(hashtext(v_term_id::text || ':session_code'));

  -- Determine the next sequence index within this term.
  select max(
      ((ascii(substring(ses.code, 2, 1)) - ascii('A')) * 999)
      + (substring(ses.code, 3, 3))::int
    )
    into v_max_index
  from public.session ses
  join public.class cls
    on cls.id = ses.class_id
  join public.schedule sch
    on sch.id = cls.schedule_id
  where sch.academic_term_id = v_term_id
    and ses.code ~ '^S[A-Z][0-9]{3}$';

  v_next_index := coalesce(v_max_index, 0) + 1;
  if v_next_index > 26 * 999 then
    raise exception 'Session code capacity exceeded for academic term %', v_term_id;
  end if;

  v_letter_idx := floor((v_next_index - 1) / 999)::int;
  v_number := ((v_next_index - 1) % 999) + 1;
  v_letter := chr(ascii('A') + v_letter_idx);

  new.code := 'S' || v_letter || lpad(v_number::text, 3, '0');

  return new;
end;
$$;

drop trigger if exists trg_session_generate_code on public.session;

create trigger trg_session_generate_code
before insert
on public.session
for each row
execute function public.generate_session_code();
