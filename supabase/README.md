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
├── 200_schema_core.sql             # Part 1/5: Key entities
├── 201_schema_programs_curriculum.sql
├── 202_schema_offerings_availability.sql
├── 203_schema_user_domain.sql
├── 204_schema_faculty_operations.sql
├── 300_constraints_unique.sql
├── 301_constraints_check.sql
├── 302_constraints_exclusion.sql
├── 400_rls_enable.sql
├── 500_triggers_updated_at.sql
├── 501_triggers_auth_signup.sql
├── 502_triggers_curriculum_course_uniqueness.sql
├── 503_triggers_designation_uniqueness.sql
├── 600_rpc_is_admin_exists.sql
├── 601_rpc_get_users_with_identity.sql
└── 602_rpc_get_user_roles.sql
```

## Seeds

Seed SQL files are stored in `seeds/` and loaded during `db reset` based on `config.toml`:

- `001_courses.sql`
- `002_departments.sql`
- `003_programs.sql`
- `004_campuses.sql`
- `005_academic_ranks.sql`
- `006_academic_terms.sql`
- `007_majors.sql`
- `008_curriculums.sql`
- `009_rooms.sql`
- `010_blocks.sql`

## Snippets

The `snippets/` folder now contains legacy migration references:

- `legacy_migrations/000_create_base_schema.sql`
- `legacy_migrations/001_rpc_is_admin_exists.sql`
- `legacy_migrations/002_create_user_on_auth_signup.sql`
- `legacy_migrations/003_rpc_get_users_with_identity.sql`
- `legacy_migrations/004_department_unique_constraints.sql`
- `legacy_migrations/005_university_unique_constraints.sql`
- `legacy_migrations/006_rpc_get_user_roles.sql`
- `legacy_migrations/007_enforce_curriculum_course_uniqueness.sql`

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

## Legacy Files

Legacy migration files are kept under `snippets/legacy_migrations/` for reference only. Do not use them for new deployments.
