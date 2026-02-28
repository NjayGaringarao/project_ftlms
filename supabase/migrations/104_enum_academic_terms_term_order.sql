do $$
begin
  create type public.academic_terms_term_order as enum ('FIRST', 'SECOND', 'THIRD', 'FOURTH');
exception
  when duplicate_object then
    null;
end
$$;
