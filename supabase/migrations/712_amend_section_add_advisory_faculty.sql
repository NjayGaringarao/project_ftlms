ALTER TABLE public.section
  ADD COLUMN IF NOT EXISTS advisory_faculty_id uuid
    REFERENCES public.user(id) ON DELETE SET NULL;
