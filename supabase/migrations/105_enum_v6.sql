-- =========================================================
-- V6 ENUM UPDATES
-- Description:
--   Refresh employment status values without dropping historical
--   department enums needed by earlier baseline migrations.
-- =========================================================

do $$
begin
	if exists (
		select 1
		from pg_type t
		join pg_namespace n on n.oid = t.typnamespace
		where n.nspname = 'public'
			and t.typname = 'employment_status_enum'
	) then
		alter type public.employment_status_enum rename to employment_status_enum_old;
	end if;
exception
	when duplicate_object then
		null;
end
$$;

do $$
begin
	create type public.employment_status_enum as enum (
		'Regular',
		'Part-time',
		'Contract of Service',
		'Temporary'
	);
exception
	when duplicate_object then
		null;
end
$$;

do $$
begin
	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'public'
			and table_name = 'user'
			and column_name = 'employment_status'
			and udt_name = 'employment_status_enum_old'
	) then
		alter table public."user"
			alter column employment_status type public.employment_status_enum
			using employment_status::text::public.employment_status_enum;
	end if;
end
$$;

drop type if exists public.employment_status_enum_old;