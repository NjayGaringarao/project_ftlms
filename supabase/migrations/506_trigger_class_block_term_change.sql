-- =========================================================
-- CLEANUP: Remove legacy class term change trigger (schedule-based)
-- =========================================================

drop trigger if exists trg_class_block_term_change on public.class;
drop function if exists public.block_class_term_change();
