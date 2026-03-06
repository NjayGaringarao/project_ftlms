-- =========================================================
-- ENUMS (V6): COLLEGE TYPE
-- Description:
--   Introduces college_type_enum for department -> college migration.
-- =========================================================

do $$
begin
  create type public.college_type_enum as enum (
    'ACADEMIC',
    'ADMINISTRATIVE',
    'STUDENT_SERVICES',
    'EXTENSION_SERVICES'
  );
exception
  when duplicate_object then
    null;
end
$$;
