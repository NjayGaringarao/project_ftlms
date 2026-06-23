# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FTLMS** (Faculty Teaching Load Management System) — a Next.js 15 + Supabase application for managing faculty teaching loads, course scheduling, and campus-college load evaluations at a university.

## Commands

All commands run from `web-app/`:

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint
```

Supabase commands run from the repo root:

```bash
npx supabase start                              # Start local Supabase (Postgres + Studio)
npx supabase db reset                          # Wipe and re-run all migrations + seeds
npx supabase migration new <name>              # Create a new migration file
npx supabase db push --linked                  # Push migrations to remote project
npx supabase gen types typescript --linked     # Regenerate TypeScript types from DB schema
```

## Architecture

### Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict)
- **Supabase** for Postgres (v17), Auth (email/password, SSR cookies), and Storage
- **Tailwind CSS v4** + **Radix UI** primitives + **shadcn-style** components in `src/components/ui/`
- **Puppeteer Core** + `@sparticuz/chromium-min` for serverless PDF generation
- Path alias: `@/*` → `src/*`

### Folder Layout

```
web-app/src/
├── app/
│   ├── (protected)/          # Auth-gated pages
│   │   └── (admin)/          # Admin-only pages
│   ├── api/                  # API route handlers (puppeteer, document-export, auth)
│   ├── auth/                 # Public auth pages (login, forgot-password)
│   └── print/                # Print-optimized views for PDF generation
├── features/                 # Core business logic, one folder per domain
├── components/ui/            # Shared base UI components
├── utils/supabase/           # Supabase client factories (client.ts, server.ts, admin.ts)
└── constants/
```

### Feature Module Structure

Every feature under `features/` follows this layout:

```
features/<name>/
├── components/    # React components ("use client" where needed)
├── lib/
│   ├── actions/   # Server actions ("use server") — mutations
│   └── *.ts       # Query functions — read-only data fetching
└── hooks/         # Client-side React hooks
```

### Data Flow

**Reading data** — Pages are async Server Components that call query functions, then pass data as props to Client Components:

```typescript
// app/(protected)/(admin)/campuses/page.tsx
const [campuses, selectedCampus] = await Promise.all([getCampusesList(), getCampusById(id)]);
return <CampusesManagement campuses={campuses} selectedCampus={selectedCampus} />;
```

**Writing data** — Client components call Server Actions which mutate Supabase and call `revalidatePath`:

```typescript
// features/admin/lib/actions/campus-actions.ts
"use server"
export async function createCampus(input) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("campus").insert(...).select().single();
  if (error) return { error: mapDuplicateError(error) };
  revalidateCampusesPaths(data.id);
  return { data };
}
```

**Supabase clients** — always use the correct factory:
- `createBrowserClient()` from `utils/supabase/client.ts` — in Client Components
- `createServerClient()` from `utils/supabase/server.ts` — in Server Components and Server Actions

### Admin Management Pattern

Admin CRUD pages (campuses, colleges, courses, users, etc.) all follow the same structure:
1. Async page fetches data in parallel, passes to a `*Management` Client Component
2. `AdminManagementList` renders a searchable/filterable list
3. A detail panel handles create/edit/delete via server actions
4. Errors from DB constraint violations are mapped in `features/admin/lib/actions/shared.ts`

### PDF / Document Export System

Async job-queue pattern to handle bulk PDF exports:
1. Client POSTs to `/api/document-export/jobs` → job inserted into `document_export_job` table with `status=QUEUED`
2. Response includes `mode: "sync" | "async"` based on document count
3. Client polls `/api/document-export/jobs/[job_id]` for completion
4. Puppeteer API routes (`/api/puppeteer/...`) generate PDFs server-side, require `runtime = "nodejs"` and `maxDuration = 60`
5. `features/document-export/lib/document-export/` contains providers keyed by document type; each provider implements `parseScopeFromBody()` and `resolveEntityIdsByScope()`

### Database Migrations

Migrations live in `supabase/migrations/` and are **strictly ordered** by numeric prefix:

| Range | Purpose |
|-------|---------|
| 100–108 | Enum types |
| 200–205 | Core schema (dependency-ordered) |
| 300–516 | Constraints, triggers, RLS |
| 700+ | Feature-specific additions |
| 1000–1011 | Seed data |

Seed data must load in the order declared in `supabase/config.toml` because of FK dependencies. Always run `npx supabase db reset` to verify a new migration doesn't break the seed sequence.

### Authentication & Authorization

- Supabase Auth with email/password; sessions stored in HTTP-only cookies via `@supabase/ssr`
- `getCurrentUser()` and `getUserRole()` in `features/auth/lib/utils.ts`
- Route protection via middleware (`features/auth/lib/middleware.ts`) — unauthenticated requests redirect to `/auth/login`
- Role/designation data fetched via RPC: `get_user_roles()`, `is_admin_exists()`
- Admin-only routes are under `app/(protected)/(admin)/`

### Key RPC Functions

Stored procedures used heavily throughout the app:

| RPC | Purpose |
|-----|---------|
| `is_admin_exists()` | Check if any admin account exists |
| `get_user_roles()` | Fetch calling user's designations |
| `get_user_data()` | Comprehensive user profile |
| `get_scheduler_matrices()` | Scheduling conflict resolution data |
| `proposal_transactions` | Campus-college load submit/evaluate workflow |

### Shared Types

Entity TypeScript types live in `features/shared/types/models/` (one file per entity) and are exported via an `index.ts`. Use these types across features rather than re-declaring inline types.
