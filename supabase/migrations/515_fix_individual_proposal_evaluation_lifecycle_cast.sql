-- Fix enum assignment when applying individual proposal evaluation.
-- `evaluation_status_enum` and `proposal_lifecycle_enum` are different enums,
-- so explicit casts are required in the CASE expression.

create or replace function public.trg_apply_individual_proposal_evaluation()
returns trigger
language plpgsql
as $$
begin
  update public.proposal
  set lifecycle_status = case
        when new.status = 'APPROVED'
          then 'APPROVED'::public.proposal_lifecycle_enum
        else 'REJECTED'::public.proposal_lifecycle_enum
      end,
      invalidated_reason = null,
      updated_at = now()
  where id = new.proposal_id;

  return null;
end;
$$;
