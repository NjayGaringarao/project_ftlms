create or replace function public.rpc_get_scheduler_matrices(
  academic_term_id uuid,
  block_id uuid default null,
  faculty_id uuid default null,
  room_id uuid default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'block',
    case
      when $2 is null then '[]'::jsonb
      else coalesce(
        (
          select jsonb_agg(row_to_json(t))
          from (
            select distinct
              s.id,
              sc.class_id,
              c.code as class_code,
              s.day,
              s.start_time,
              s.end_time
            from public.session_class sc
            join public.session s
              on s.id = sc.session_id
            join public.class c
              on c.id = sc.class_id
            join public.course_utilization cu
              on cu.class_id = c.id
            join public.block b
              on b.id = cu.block_id
            where b.id = $2
              and b.academic_term_id = $1
          ) t
        ),
        '[]'::jsonb
      )
    end,
    'faculty',
    case
      when $3 is null then '[]'::jsonb
      else coalesce(
        (
          select jsonb_agg(row_to_json(t))
          from (
            select distinct
              s.id,
              sc.class_id,
              c.code as class_code,
              s.day,
              s.start_time,
              s.end_time
            from public.session_class sc
            join public.session s
              on s.id = sc.session_id
            join public.class c
              on c.id = sc.class_id
            join public.user_class uc
              on uc.class_id = c.id
            join public.course_utilization cu
              on cu.class_id = c.id
            join public.block b
              on b.id = cu.block_id
            where uc.user_id = $3
              and b.academic_term_id = $1
          ) t
        ),
        '[]'::jsonb
      )
    end,
    'room',
    case
      when $4 is null then '[]'::jsonb
      else coalesce(
        (
          select jsonb_agg(row_to_json(t))
          from (
            select distinct
              s.id,
              sc.class_id,
              c.code as class_code,
              s.day,
              s.start_time,
              s.end_time
            from public.session_class sc
            join public.session s
              on s.id = sc.session_id
            join public.class c
              on c.id = sc.class_id
            join public.course_utilization cu
              on cu.class_id = c.id
            join public.block b
              on b.id = cu.block_id
            where s.room_id = $4
              and b.academic_term_id = $1
          ) t
        ),
        '[]'::jsonb
      )
    end
  );
$$;
