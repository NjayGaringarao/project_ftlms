-- =========================================================
-- CLEANUP: Remove legacy class term change trigger (schedule-based)
-- =========================================================

drop trigger if exists trg_class_section_term_change on public.class;
drop function if exists public.section_class_term_change();
