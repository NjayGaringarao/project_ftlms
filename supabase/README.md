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
├── 100_enum_employment_status.sql  # FULL_TIME, PART_TIME
├── 101_enum_evaluation_status.sql  # PENDING, APPROVED, REJECTED
├── 102_enum_department_type.sql    # ACADEMIC, ADMINISTRATIVE, etc.
├── 103_enum_academic_terms_type.sql
├── 104_enum_academic_terms_term_order.sql
├── 105_enum_v6.sql
├── 106_enum_designation_title_v6.sql
├── 107_academic_level_v6.sql
├── 108_enum_college_type_v6.sql
├── 200_schema_core.sql             # Part 1/5: Key entities
├── 201_schema_programs_curriculum.sql
├── 202_schema_offerings_availability.sql
├── 203_schema_user_domain.sql
├── 204_schema_faculty_operations.sql
├── 205_schema_core_v6.sql
├── 207_schema_user_domain_v6.sql
├── 206_schema_scheduling_v6.sql
├── 300_constraints_unique.sql
├── 301_constraints_check.sql
├── 302_constraints_exclusion.sql
├── 303_constraints_class_delivery.sql
├── 304_constraints_scheduling_v6.sql
├── 400_rls_enable.sql
├── 500_triggers_updated_at.sql
├── 501_triggers_auth_signup.sql
├── 502_triggers_curriculum_course_uniqueness.sql
├── 503_triggers_designation_uniqueness.sql
├── 504_triggers_class_delivery_block_ownership.sql
├── 505_allow_multiple_class_delivery_per_allocation.sql
├── 600_rpc_is_admin_exists.sql
├── 601_rpc_get_users_with_identity.sql
├── 602_rpc_get_user_roles.sql
├── 603_rpc_schedule_conflict_detection.sql
├── 607_schema_cutover_v6.sql
├── 608_rpc_get_users_with_identity_v6.sql
├── 609_rpc_get_user_roles_v6.sql
└── 610_rpc_schedule_conflict_detection_v6.sql
```

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

- **Refactor mode**
  - Purpose: clean/reorganize migration history in development for a clearer canonical chain.
  - Rule: may edit/delete/reorder existing migration files, but only in local development.
  - Required follow-up: run the Migration Consistency Check section before continuing work.

### AI Agent Guidance

When updating migrations in this repository:

- First identify active mode: **implementation** or **refactor**.
- In **implementation mode**, do not modify historical migrations; add a new migration file.
- In **refactor mode**, preserve chronological intent (schema → constraints → triggers → rpc).
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
