# Supabase Database Setup

## Prerequisites

- Node.js installed
- Supabase account (logged in via browser)
- Supabase project (already initialized)

## Initial Setup

1. **Install Supabase CLI**

   ```bash
   npx supabase
   ```

   The terminal will prompt you to install Supabase CLI if not already installed.

2. **Login to Supabase**

   ```bash
   npx supabase login
   ```

   Make sure you're already logged into Supabase in your default browser.

3. **Link Your Project**
   ```bash
   npx supabase link
   ```
   Run this again whenever you switch to a different Supabase project.

## Migration Commands

| Command                             | Description                              |
| ----------------------------------- | ---------------------------------------- |
| `npx supabase db push --linked`     | Run all pending migrations               |
| `npx supabase db reset --linked`    | Reset database and re-run all migrations |
| `npx supabase migration list`       | List all migrations and their status     |
| `npx supabase migration new <name>` | Create a new migration file              |

> **Warning**: `db reset` will destroy all data. Never use in production!

## Migration File Structure

Migrations are executed in alphabetical order. Files are organized by prefix:

| Prefix | Category    | Description                                         |
| ------ | ----------- | --------------------------------------------------- |
| `000_` | Extensions  | PostgreSQL extensions (pgcrypto, btree_gist)        |
| `1xx_` | Enums       | Custom enum types                                   |
| `2xx_` | Core Schema | Dependency-ordered table definitions (6-part split) |
| `3xx_` | Constraints | Unique, check, and exclusion constraints            |
| `400_` | RLS         | Row Level Security policies                         |
| `5xx_` | Triggers    | Database triggers and functions                     |
| `6xx_` | RPC         | Remote Procedure Calls (stored functions)           |

### Current Migrations

```
migrations/
- 000_extensions.sql
- 100_enum_employment_status.sql
- 101_enum_evaluation_status.sql
- 102_enum_day_of_week.sql
- 103_enum_academic_term_name.sql
- 104_enum_designation_title.sql
- 105_enum_academic_level.sql
- 106_enum_session_type.sql
- 107_enum_proposal_lifecycle.sql
- 108_enum_proposal_evaluation_steps.sql
- 200_schema_core.sql
- 201_schema_programs_curriculum.sql
- 202_schema_offerings_availability.sql
- 203_schema_user_domain.sql
- 204_schema_faculty_operations.sql
- 205_schema_load_evaluations.sql
- 300_constraints_unique.sql
- 301_constraints_check.sql
- 302_constraints_academic_term.sql
- 303_constraints_offerings.sql
- 304_constraints_scheduling.sql
- 305_constraints_designation.sql
- 306_constraints_evaluation.sql
- 400_rls_enable.sql
- 500_triggers_updated_at.sql
- 501_triggers_auth_signup.sql
- 503_triggers_designation_uniqueness.sql
- 504_trigger_class_section_schedule_course_uniqueness.sql
- 505_trigger_class_code_autogenerate.sql
- 506_trigger_class_section_term_change.sql
- 507_trigger_course_utilization_autocreate_class.sql
- 508_trigger_session_code_autogenerate.sql
- 509_trigger_course_utilization_prevent_delete_with_sessions.sql
- 510_trigger_major_offering_code.sql
- 511_trigger_section_code.sql
- 512_trigger_program_offering_code.sql
- 513_trigger_academic_term_code.sql
- 514_trigger_academic_year_code.sql
- 515_trigger_proposal_invalidation.sql
- 516_trigger_proposal_workflow.sql
- 517_trigger_approved_proposal_invalidation.sql
- 516_trigger_proposal_workflow.sql
- 600_rpc_is_admin_exists.sql
- 602_rpc_get_user_roles.sql
- 605_get_scheduler_matrices.sql
- 607_rpc_get_user_data.sql
- 608_rpc_proposal_transactions.sql
- 609_rpc_storage_attachment_maintenance.sql
```

### Core Schema Ownership (2xx)

- `200_schema_core.sql`
  - Foundational entities used by all later schema parts.

- `201_schema_programs_curriculum.sql`
  - Program and major structures.

- `202_schema_offerings_availability.sql`
  - Program/major offerings and term-scoped sections.

- `203_schema_user_domain.sql`
  - User profile, identity, degree, and designation entities.

- `204_schema_faculty_operations.sql`
  - Class/session operations (`class`, `course_utilization`, `user_class`, `session`, `session_class`).

- `205_schema_load_evaluations.sql`
  - Campus-college load workflow entities (`campus_college_load`, `campus_college_load_revision`, `campus_college_load_evaluation`).
  - Includes `document_export_job` schema (async export job persistence).

### Constraint Ownership (3xx)

- `300_constraints_unique.sql`
  - Unique constraints for core/master entities.

- `303_constraints_offerings.sql`
  - Offering uniqueness constraints.
  - Canonical owner of: `program_offering_unique`, `major_offering_unique`.

- `301_constraints_check.sql`
  - General check constraints (course/section/room/session/evaluation).
  - Canonical owner of: `session_time_range_valid`.

- `302_constraints_academic_term.sql`
  - Academic-term constraints (exclusion and check rules).
  - Canonical owner of: `academic_term_reasonable_dates_check`, `academic_term_no_global_date_overlap`.

- `304_constraints_scheduling.sql`
  - Scheduling uniqueness constraints and performance indexes.
  - Canonical owner of: `schedule_user_term_unique`, `section_major_term_year_name_unique`, `class_schedule_course_code_unique`, `class_section_unique`, `section_advisory_faculty_fk`.
  - Owns the `section.advisory_faculty_id` FK (column defined in `202`; `public."user"` defined later in `203`).

- `305_constraints_designation.sql`
  - Designation check constraints only.
  - Canonical owner of: `designation_load_nonnegative`, `designation_role_context_rules`.

- `306_constraints_evaluation.sql`
  - Campus-college load workflow constraints.
  - Canonical owner of: `campus_college_load_scope_unique`, `campus_college_load_revision_number_unique`, `campus_college_load_evaluation_step_unique`, `campus_college_load_attachment_bucket_check`, `campus_college_load_evaluation_attachment_bucket_check`.

- `503_triggers_designation_uniqueness.sql`
  - Designation uniqueness enforcement logic (trigger/function), complementary to `305` checks.

### Trigger Ownership (5xx/6xx)

- `509_trigger_course_utilization_prevent_delete_with_sessions.sql`
  - Canonical owner of:
    - `prevent_course_utilization_delete_with_sessions`
    - `trg_prevent_delete_course_utilization_with_sessions` trigger
  - Scope: prevents deleting `course_utilization` rows when linked classes still have sessions.

- `515_trigger_proposal_invalidation.sql`
  - Canonical owner of the return-on-source-change invalidation logic:
    - `invalidate_submitted_campus_college_loads_for_scope/_section/_class/_course/_session`
    - `trg_invalidate_campus_college_load_from_*` trigger functions and their triggers on
      `course_utilization`, `user_class`, `session_class`, `session`, `section`, `class`, `course`.
  - Scope: submitted revisions are immutable snapshots; when source schedule data changes
    afterward, the affected load is auto-returned to Program Chair via a `system_generated`
    evaluation row.

- `516_trigger_proposal_workflow.sql`
  - Canonical owner of:
    - `designation_program_offering_scope`
    - `trg_validate_campus_college_load_revision`
    - `trg_apply_campus_college_load_revision`
    - `trg_validate_campus_college_load_evaluation` (also handles `system_generated` returns emitted by `515` invalidation)
    - `trg_apply_campus_college_load_evaluation`
  - Scope: campus-college load submission and evaluation transitions.

- `608_rpc_proposal_transactions.sql`
  - Canonical owner of:
    - `claim_document_export_job`
  - Scope: async export job claim locking.

- `609_rpc_storage_attachment_maintenance.sql`
  - Canonical owner of:
    - `storage_scope_from_path`
    - `purge_stale_campus_college_load_staged_attachments`
  - Scope: staged return-attachment upload helpers and stale-staging cleanup.


## Regression Harness (Development)

- `tests/campus_college_load_workflow_regression.sql`
  - Verifies campus-college load workflow guards for:
    - Program Chairperson submission scope
    - same-campus, same-college revision
    - Campus Director, DI, and VPAA step ordering
    - required return comments
  - Runs inside a transaction and rolls back automatically.
  - Execute via Supabase SQL Editor (local/linked) or any SQL client against your dev database.

## Migration Consistency Check

Run this sequence after editing migration history (development only):

```bash
# Rebuild local database from migration chain
npx supabase db reset

# Confirm local/linked migration status
npx supabase migration list

# Confirm no unexpected schema drift
npx supabase db diff --linked
```

Expected result: `db reset` succeeds and `db diff --linked` is empty (or only contains intentional pending changes).

## Development-Only Migration Rewrite Policy

This project is currently maintained by a single developer in a non-production environment.

- Migration history rewrites (edit/delete/reorder existing migration files) are allowed **only** while still in local development.
- After rewriting migrations, always run the consistency check above.
- Once this project is shared across teammates/environments, treat existing migrations as immutable and add new migrations instead.

## Migration Management Modes

This project uses two migration management modes:

- **Implementation mode**
  - Purpose: introduce new database behavior or schema changes.
  - Rule: always create a **new migration file**.
  - Typical command: `npx supabase migration new <name>`.

- **Consolidation mode**
  - Purpose: fold append-only migrations into their canonical base files to keep a clean, readable history.
  - Rule: may edit/delete/reorder existing migration files **only** in local development, and only after verifying no trigger/RPC dependencies are broken.
  - Preferred approach: move the *latest* definition into the correct category file (schema → constraints → triggers → RPC) and delete the append-only file.
  - Required follow-up: run the Migration Consistency Check section before continuing work (include `db reset --linked` when validating against the linked project).

### AI Agent Guidance

When updating migrations in this repository:

- First identify active mode: **implementation** or **consolidation**.
- In **implementation mode**, do not modify historical migrations; add a new migration file.
- In **consolidation mode**, preserve chronological intent (schema → constraints → triggers → rpc).
- If a consolidation migration is removed, redistribute its effective logic into the correct earlier migration categories.
- Never leave duplicate final-state constraints/triggers under different names.
- Keep this README migration list synchronized with actual files in `supabase/migrations/`.


## Seeds

Seed SQL files are stored in `seeds/` and loaded during `db reset` based on `config.toml`:

* `1000_academic_ranks.sql`
* `1001_courses.sql`
* `1002_colleges.sql`
* `1003_campuses.sql`
* `1004_programs.sql`
* `1005_majors.sql`
* `1006_program_offerings.sql`
* `1007_major_offerings.sql`
* `1008_academic_years.sql`
* `1009_academic_terms.sql`
* `1010_sections.sql`
* `1011_rooms.sql`

> **Note:**
> - `1008_academic_years.sql` and `1009_academic_terms.sql` replace the old `1008_academic_terms.sql`.
> - `1010_sections.sql` and `1011_rooms.sql` replace the old `1009_blocks.sql` and `1010_rooms.sql`.
> - The order in this list must match the `sql_paths` in `config.toml` for correct dependency loading.

## Useful Commands

```bash
# Check migration status
npx supabase migration list

# Generate types for TypeScript
npx supabase gen types typescript --linked > types/supabase.ts

# View database diff
npx supabase db diff

# Start local development
npx supabase start

# Stop local development
npx supabase stop
```

