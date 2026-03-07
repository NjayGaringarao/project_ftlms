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
| `2xx_` | Core Schema | Dependency-ordered table definitions (5-part split) |
| `3xx_` | Constraints | Unique, check, and exclusion constraints            |
| `400_` | RLS         | Row Level Security policies                         |
| `5xx_` | Triggers    | Database triggers and functions                     |
| `6xx_` | RPC         | Remote Procedure Calls (stored functions)           |

### Current Migrations

```
migrations/
├── 000_extensions.sql              # pgcrypto, btree_gist
├── 100_enum_employment_status.sql  # Regular, Part-time, Contract of Service, Temporary
├── 101_enum_evaluation_status.sql  # PENDING, APPROVED, REJECTED
├── 103_enum_academic_terms_type.sql
├── 104_enum_academic_terms_term_order.sql
├── 106_enum_designation_title.sql
├── 107_enum_academic_level.sql
├── 200_schema_core.sql             # Part 1/5: Key entities
├── 201_schema_programs_curriculum.sql
├── 202_schema_offerings_availability.sql
├── 203_schema_user_domain.sql
├── 204_schema_faculty_operations.sql
├── 300_constraints_unique.sql
├── 301_constraints_check.sql
├── 302_constraints_exclusion.sql
├── 303_constraints_offerings.sql
├── 304_constraints_scheduling.sql
├── 305_constraints_designation.sql
├── 306_constraints_evaluation.sql
├── 400_rls_enable.sql
├── 500_triggers_updated_at.sql
├── 501_triggers_auth_signup.sql
├── 503_triggers_designation_uniqueness.sql
├── 600_rpc_is_admin_exists.sql
├── 601_rpc_get_users_with_identity.sql
├── 602_rpc_get_user_roles.sql
└── 603_rpc_schedule_conflict_detection.sql
```

### Constraint Ownership (3xx)

- `300_constraints_unique.sql`
  - Unique constraints for core/master entities.

- `303_constraints_offerings.sql`
  - Offering uniqueness constraints.
  - Canonical owner of: `program_offering_unique`, `major_offering_unique`.

- `301_constraints_check.sql`
  - General check constraints (course/term/block/room/session/evaluation).
  - Canonical owner of: `session_time_range_valid`.

- `302_constraints_academic_term.sql`
  - Constraint for academic term.

- `304_constraints_scheduling.sql`
  - Scheduling uniqueness constraints and performance indexes.
  - Canonical owner of: `schedule_user_term_unique`, `block_major_term_year_section_unique`, `class_schedule_course_code_unique`, `class_block_unique`.

- `305_constraints_designation.sql`
  - Designation check constraints only.
  - Canonical owner of: `designation_load_nonnegative`, `designation_role_context_rules`.

- `306_constraints_evaluation.sql`
  - Evaluation uniqueness constraints.
  - Canonical owner of: `evaluation_designation_schedule_unique`.

- `503_triggers_designation_uniqueness.sql`
  - Designation uniqueness enforcement logic (trigger/function), complementary to `305` checks.

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
  - Purpose: consolidate/clean migration history in development for a clearer canonical chain.
  - Rule: may edit/delete/reorder existing migration files, but only in local development.
  - Required follow-up: run the Migration Consistency Check section before continuing work.

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

- `001_courses.sql`
- `002_departments.sql`
- `003_programs.sql`
- `004_campuses.sql`
- `005_academic_ranks.sql`
- `006_academic_terms.sql`
- `007_majors.sql`
- `008_rooms.sql`
- `009_blocks.sql`

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
