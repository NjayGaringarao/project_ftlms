-- Harden campus proposal invalidation trigger for individual proposal lifecycle/scope changes.

create or replace function public.trg_invalidate_campus_proposal_on_proposal_change()
returns trigger
language plpgsql
as $$
declare
  v_scope_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.lifecycle_status = 'ACTIVE' then
      perform public.invalidate_current_campus_proposals(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_CREATED'
      );
    end if;
    return null;
  end if;

  if tg_op = 'DELETE' then
    perform public.invalidate_current_campus_proposals(
      old.campus_id,
      old.academic_term_id,
      'INDIVIDUAL_PROPOSAL_DELETED'
    );
    return null;
  end if;

  v_scope_changed :=
    old.campus_id is distinct from new.campus_id
    or old.academic_term_id is distinct from new.academic_term_id;

  if v_scope_changed then
    perform public.invalidate_current_campus_proposals(
      old.campus_id,
      old.academic_term_id,
      'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED'
    );
    perform public.invalidate_current_campus_proposals(
      new.campus_id,
      new.academic_term_id,
      'INDIVIDUAL_PROPOSAL_SCOPE_CHANGED'
    );
    return null;
  end if;

  if new.lifecycle_status is distinct from old.lifecycle_status then
    if new.lifecycle_status = 'INVALIDATED' then
      perform public.invalidate_current_campus_proposals(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_INVALIDATED'
      );
    elsif new.lifecycle_status = 'REJECTED' then
      perform public.invalidate_current_campus_proposals(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_REJECTED'
      );
    elsif new.lifecycle_status = 'ACTIVE' then
      perform public.invalidate_current_campus_proposals(
        new.campus_id,
        new.academic_term_id,
        'INDIVIDUAL_PROPOSAL_CREATED'
      );
    end if;
  end if;

  return null;
end;
$$;

comment on function public.trg_invalidate_campus_proposal_on_proposal_change()
is 'Canonical owner (v617): invalidates current campus proposals when scoped individual proposal lifecycle/scope changes occur.';

drop trigger if exists invalidate_campus_proposal_on_proposal_change
on public.proposal;

create trigger invalidate_campus_proposal_on_proposal_change
after insert or delete or update of lifecycle_status, campus_id, academic_term_id
on public.proposal
for each row execute function public.trg_invalidate_campus_proposal_on_proposal_change();
