# Project FTLMS System Specification

## 1. Document Scope

This document summarizes the implemented system architecture, technical stack, and operational constraints of Project FTLMS.

Excluded from this document by request:
- Functional requirements
- Non-functional requirements

## 2. System Architecture Summary

### 2.1 High-Level Architecture

Project FTLMS is implemented as a web application backed by Supabase (PostgreSQL + Auth + Storage + RPC), with server-rendered and API-driven workflows.

Primary architecture style:
- Next.js App Router application (`web-app`) for UI, server components, and API route handlers
- Supabase as the system of record and authorization boundary (`supabase` migrations, RPC, RLS)
- Document export subsystem that renders print routes and generates PDFs using Puppeteer

### 2.2 Repository-Level Architecture

Top-level solution boundaries:
- `web-app/`: Next.js frontend + backend-for-frontend (BFF) logic
- `supabase/`: database schema, constraints, RLS policies, triggers, RPCs, and seed data

### 2.3 Web Application Architecture (`web-app`)

Key structural layers:
- Route layer: `src/app` using App Router with route groups (e.g., protected routes, print routes, API routes)
- UI layer: `src/components` and route pages
- Domain/service layer: `src/lib/*` organized by domain (`admin`, `schedule`, `load-proposal`, `course-loading`, `document-export`, etc.)
- Data access clients: `src/utils/supabase/*` for server, browser, and admin clients
- Shared model types: `src/models/*`

Runtime routing partitions:
- Protected workspace routes under `src/app/(protected)`
- API routes under `src/app/api`
- Print rendering routes under `src/app/print`

### 2.4 Access and Authorization Architecture

Authentication and session handling:
- Supabase Auth is used for user identity and session state
- Session refresh middleware is implemented through `src/lib/middleware.ts` and applied by `src/middleware`
- Protected layout (`src/app/(protected)/layout.tsx`) enforces signed-in access and redirects unauthenticated users

Role-driven navigation and route intent:
- Role set includes `Admin`, `Program Chairperson`, `Faculty`, `Campus Director`, `College Dean`, `Vice President for Academic Affairs`, and `Director for Instruction`
- Navigation and route visibility are role-scoped in `src/constant/navigation.ts`

### 2.5 Database Architecture (`supabase`)

Schema evolution is migration-driven and ordered by file prefix:
- `000_`: extensions
- `1xx_`: enums
- `2xx_`: schema partitions
- `3xx_`: constraints
- `400_`: RLS enablement
- `5xx_`: triggers/functions
- `6xx_`: RPC and workflow procedures

Core data domains represented in migrations/models:
- Academic structure: colleges, programs, majors, offerings, terms, sections
- Identity and staffing: users, designations, ranks, degrees
- Scheduling: classes, sessions, room assignment, user-class mapping
- Campus-college load workflow: scoped load revisions, evaluation steps, statuses
- Export operations: document export job persistence and claim RPC

### 2.6 Document Export and Print Architecture

Export subsystem components:
- Print pages render document UI under `src/app/print/documents/...`
- API routes under `src/app/api/document-export/jobs/...` manage async export jobs
- PDF generation uses Puppeteer and merges chunks with `pdf-lib`
- Generated files are persisted in Supabase Storage bucket `ftl-exports`

Processing pattern:
- Sync mode for small document counts
- Async chunked mode for larger document sets
- Job lifecycle states: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`

## 3. Technical Stack

### 3.1 Application Stack

Frontend and runtime:
- Next.js `16.1.6` (App Router)
- React `19.2.3`
- TypeScript `5` with strict mode enabled

Styling and UI:
- Tailwind CSS `4`
- Radix UI primitives
- Utility packages: `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

Data and backend integration:
- `@supabase/supabase-js` and `@supabase/ssr`
- Supabase RPC usage for role resolution and export job locking

Document generation:
- `puppeteer-core`
- `@sparticuz/chromium` and `@sparticuz/chromium-min` for Chromium runtime packaging
- `pdf-lib` for chunk merge/final assembly

Charts/visualization:
- `recharts`

Tooling:
- ESLint `9` with `eslint-config-next`
- PostCSS + Tailwind tooling

### 3.2 Data Platform Stack

Platform:
- Supabase CLI-managed project
- PostgreSQL major version `17` (local config)

Supabase services enabled in local config:
- API
- Auth
- Realtime
- Studio
- Storage
- Inbucket (email testing)

Database delivery model:
- SQL migrations + ordered SQL seeds
- Trigger and RPC heavy domain workflow enforcement

## 4. Operational Constraints

### 4.1 Environment and Configuration Constraints

Required environment/runtime conditions:
- Supabase URL and publishable/anon key must be configured for server/client access
- Service-role style secret key (`SUPABASE_SECRET_DEFAULT_KEY`) is required for admin client paths
- App routes that render PDFs/screenshots require Node.js runtime (`runtime = "nodejs"`)

Browser automation constraints:
- Local execution requires a discoverable Chrome/Edge binary or explicit executable path env var
- Vercel execution expects Sparticuz Chromium packaging flow and pack availability

### 4.2 Access Control Constraints

Authentication requirements:
- Protected pages require a valid Supabase user session
- Document export API and print routes require authenticated user context
- Export job lookup and processing are constrained to `requester_user_id`

Role constraints:
- Major feature areas are role-scoped through navigation and route-level checks
- Campus-college load evaluation is segmented across Campus Director, DI, and VPAA responsibilities

### 4.3 Data and Workflow Constraints

Database governance constraints:
- Migration order is semantically significant and must be preserved
- Seed ordering is dependency-sensitive and defined in `supabase/config.toml`
- Triggers and constraints enforce scheduling integrity and campus-college load workflow transitions

Workflow isolation constraints:
- Export job claim uses RPC-based lock semantics (`claim_document_export_job`)
- Job completion/failure transitions are persisted and retrievable through polling endpoints

### 4.4 Export Pipeline Constraints

Hard limits and behavior:
- Synchronous export upper bound: `50` documents
- Asynchronous export upper bound: `1000` documents per job
- Async chunk size: `20` documents per tick
- API route max duration for heavy export endpoints: `60` seconds
- Print page navigation timeout for rendering: `30000` ms
- Signed file URL TTL: `3600` seconds
- Job expiry target on creation: `7` days from creation time

Storage constraints:
- Default export storage bucket: `ftl-exports`
- Download URL generation depends on non-expired completed job state and valid output path

### 4.5 Supabase Local Configuration Constraints

Configured local limits and parameters (from `supabase/config.toml`):
- API max rows limit: `1000`
- JWT expiry: `3600` seconds
- Refresh token rotation enabled
- Local DB major version pinned to `17`
- Seed execution enabled and explicitly ordered

### 4.6 Build and Delivery Constraints

Build/runtime commands in current project setup:
- Development: `npm run dev`
- Build: `npm run build`
- Production start: `npm run start`
- Lint: `npm run lint`

Database lifecycle commands (Supabase CLI):
- Push migrations: `npx supabase db push --linked`
- Reset and replay migrations+seeds: `npx supabase db reset --linked`
- Check migration state: `npx supabase migration list`

## 5. Traceability References

Primary sources used for this summary:
- `web-app/package.json`
- `web-app/src/app/(protected)/layout.tsx`
- `web-app/src/lib/middleware.ts`
- `web-app/src/middleware`
- `web-app/src/constant/navigation.ts`
- `web-app/src/utils/supabase/server.ts`
- `web-app/src/utils/supabase/admin.ts`
- `web-app/src/app/api/document-export/jobs/route.ts`
- `web-app/src/app/api/document-export/jobs/[job_id]/route.ts`
- `web-app/src/app/api/document-export/jobs/[job_id]/tick/route.ts`
- `web-app/src/app/api/puppeteer/screenshot/route.ts`
- `web-app/src/app/api/puppeteer/pdf/documents/[document_type]/scope/[academic_term_id]/route.ts`
- `web-app/src/lib/document-export/*`
- `web-app/src/lib/puppeteer/browser.ts`
- `web-app/src/features/campus-college-load/*`
- `supabase/README.md`
- `supabase/config.toml`
- `supabase/migrations/*`
