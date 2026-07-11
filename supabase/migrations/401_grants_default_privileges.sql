-- =========================================================
-- ACCESS CONTROL: Default PostgREST role grants
-- Description:
--   Standard Supabase project boilerplate that was missing from this
--   project's migrations. Without it, anon/authenticated/service_role have
--   no table/sequence/function privileges at all on a fresh database, so
--   `npx supabase db reset` produces a database the app cannot read or
--   write through PostgREST (every request fails with "permission denied").
--   Hosted Supabase projects apply this automatically at the platform
--   level, which is why the gap went unnoticed while pointed at a remote
--   project. Row Level Security (see 400_rls_enable.sql) remains the real
--   access boundary for tables that enable it; everything else in this
--   project relies on app-layer checks and DB triggers instead, which is
--   the existing security model for e.g. campus_college_load.
-- =========================================================

-- grant usage on schema public to anon, authenticated, service_role;

-- grant all on all tables in schema public to anon, authenticated, service_role;
-- grant all on all sequences in schema public to anon, authenticated, service_role;
-- grant all on all routines in schema public to anon, authenticated, service_role;

-- alter default privileges in schema public
--   grant all on tables to anon, authenticated, service_role;
-- alter default privileges in schema public
--   grant all on sequences to anon, authenticated, service_role;
-- alter default privileges in schema public
--   grant all on routines to anon, authenticated, service_role;
