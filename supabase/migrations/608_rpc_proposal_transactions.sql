create or replace function public.claim_document_export_job(
  p_job_id uuid,
  p_requester_user_id uuid,
  p_lock_seconds integer default 120
)
returns public.document_export_job
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_claimed public.document_export_job;
begin
  update public.document_export_job job
  set
    status = 'PROCESSING',
    started_at = coalesce(job.started_at, now()),
    lock_token = gen_random_uuid(),
    lock_expires_at = now() + make_interval(secs => greatest(coalesce(p_lock_seconds, 120), 30))
  where job.id = p_job_id
    and job.requester_user_id = p_requester_user_id
    and job.status in ('QUEUED', 'PROCESSING')
    and (job.lock_expires_at is null or job.lock_expires_at < now())
  returning job.* into v_claimed;

  return v_claimed;
end;
$$;

grant execute on function public.claim_document_export_job(uuid, uuid, integer) to authenticated;
