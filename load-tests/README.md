# FTLMS Load Testing

k6 load tests for two flows:

- **Scheduler** (`/scheduler`) — DB-read-heavy page backed by the `get_scheduler_matrices()` RPC.
- **Campus-college load submit/evaluate** (`/campus-college-load`) — DB-write / trigger-contention-heavy proposal workflow.

Each flow has two variants:

- **`.browser.js`** — drives a real headless Chrome through the actual login form and app UI. Highest fidelity, lower scale.
- **`.rest.js`** — cookie/token-injected plain HTTP. No browser, scales much higher. Writes go straight to Supabase PostgREST with the impersonated user's JWT rather than replaying Next.js Server Actions (their wire format is build-specific and not safely rerunnable — see comments in `campus-college-load.browser.js`).

## Prerequisites

1. `npx supabase start` (repo root) — local Supabase running.
2. The dev server pointed at **local** Supabase, not wherever `web-app/.env.local` normally points (likely a remote project) — see below.
3. [k6](https://k6.io) installed (`k6 version`). The browser module is bundled since k6 v0.52 — no extra build step.
4. A Chromium-based browser installed locally (e.g. Google Chrome) for the `.browser.js` scripts.

### Pointing the dev server at local Supabase

`web-app/.env.local.loadtest` (gitignored) has the local Supabase URL/keys. Next.js only reads `.env.local`, so swap it in before load testing and swap it back out after:

```sh
# from web-app/
cp .env.local .env.local.backup        # first time only, keep your real config safe
cp .env.local.loadtest .env.local
npm run dev

# when you're done load testing:
cp .env.local.backup .env.local
```

If the values in `.env.local.loadtest` ever go stale (e.g. after `supabase stop`/`start` with a different `config.toml`), regenerate them from `npx supabase status` (repo root) — `API_URL` → `NEXT_PUBLIC_SUPABASE_URL`, `PUBLISHABLE_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SECRET_KEY` → `SUPABASE_SECRET_DEFAULT_KEY`.

## First-time setup

```sh
cd load-tests
npm install
cp .env.example .env
```

Fill in `.env`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_SECRET_DEFAULT_KEY` — same values as `web-app/.env` for your local Supabase instance.

Then create `load-tests/base_users.csv` (gitignored — never committed) with your real base user roster. Columns:

```
ROLE,EMAIL,PASSWORD,FIRST NAME,MIDDLE NAME,LAST NAME,SUFFIX,PROFESSIONAL EXTENSION,ADDRESS,DESIGNATION,CAMPUS,COLLEGE
```

- `ROLE` — `ADMIN` or `USER`. Exactly one `ADMIN` row bootstraps the account the whole app is gated behind (`is_admin_exists()`); a fresh `db reset` wipes it, so this file is what makes `npm run seed` self-sufficient again.
- `DESIGNATION` — free text, but only a fixed set of prefixes are understood (see `scripts/lib/designation-parser.ts`): `PROGRAM CHAIR - <CAMPUS> <PROGRAM CODE>`, `CAMPUS DIRECTOR - <CAMPUS>`, `CAMPUS FACULTY PRESIDENT -<CAMPUS>`, `DIRECTOR FOR INSTRUCTION`, `VICE PRESIDENT FOR ACADEMIC AFFAIRS`, or blank (profile only, no designation). Unrecognized text fails loudly rather than being silently dropped — add a pattern for it if you introduce a new role.
- `CAMPUS` — matched against `campus.name` (e.g. `CASTILLEJOS` → `Castillejos`). `COLLEGE` — matched against `college.code` exactly (e.g. `CCIT`).

Then:

```sh
npm run seed
```

This is idempotent — safe to rerun. It:
- Seeds every row in `base_users.csv`: creates the auth user if missing (existing passwords are never overwritten), fills in their `identity` row (name/suffix/professional extension/address) and `user` profile (campus/college), and creates their designation per the rules above.
- Picks the real Castillejos/BSCS program-offering + section (from `supabase/seeds/`) and remembers it in `.state/seed-scope.json`.
- Derives the four roles the k6 scripts need (`chair`, `campusDirector`, `dfi`, `vpaa`) by matching seeded rows against fixed predicates in `seed-test-users.ts` — `chair` specifically requires a Program Chairperson at Castillejos/BSCS since that's what `seed-scope.json` and `seed-evaluation-batch.ts` are scoped to. If your CSV doesn't have a row satisfying one of these four, the script fails loudly rather than seeding a half-usable state.
- Writes `.state/personas.json` (the 4 derived roles, including their password — used by the browser scripts to log in via the real UI) and `.state/users.json` (every seeded row, no passwords).

**Director for Instruction, Vice President for Academic Affairs, and campus-scoped roles like Campus Director are uniqueness-constrained** by the DB (see `503_triggers_designation_uniqueness.sql`). If a designation the CSV wants to assign already exists for a *different* user, the seed script fails loudly rather than reassigning it — reset the local DB (`npx supabase db reset`, repo root) or fix the CSV.

## Running the tests

```sh
npm run loadtest:scheduler:browser
npm run loadtest:scheduler:rest
npm run loadtest:ccl:browser
npm run loadtest:ccl:rest
```

Override load shape via env vars (in `.env` or inline): `LOAD_TEST_VUS`, `LOAD_TEST_DURATION` (REST scenarios), `LOAD_TEST_ITERATIONS` (browser scenarios).

`loadtest:ccl:rest` runs `reset` and `seed:eval-batch` first every time — the campus-college-load workflow is stateful (a revision/evaluation can't be replayed), so each run needs a fresh batch of pre-queued data. Roughly size the batch (`LOAD_TEST_EVAL_BATCH_SIZE` in `.env`) as:

```
batch_size ≈ VUS * DURATION_SECONDS / expected_seconds_per_iteration
```

`loadtest:ccl:rest` has two parts:
- A **submit race test**: many VUs simultaneously try to submit the same fresh load. A DB uniqueness constraint guarantees exactly one wins — the test checks nobody gets a 5xx and losers fail cleanly (4xx).
- An **evaluate load test**: VUs consume distinct pre-seeded revisions at each evaluation step (Campus Director / Director for Instruction / VPAA), exercising the workflow's step-validation triggers at volume.

## Finding the breaking point (ramp tests)

```sh
npm run loadtest:scheduler:rest:ramp
npm run loadtest:ccl:rest:ramp
```

Instead of manually rerunning `loadtest:scheduler:rest` at increasing `LOAD_TEST_VUS` values, these climb through a staircase of VU levels *in one run* — `LOAD_TEST_RAMP_TARGETS` (default `10,25,50,75,100`), holding at each level for `LOAD_TEST_RAMP_STAGE_DURATION` (default `30s`) with `LOAD_TEST_RAMP_STEP_DURATION` (default `5s`) to ramp between levels. Watch k6's live output for which level `http_req_duration` (p95) or `http_req_failed` starts climbing — that's your capacity ceiling against a local `next dev` server + local Supabase (not representative of a production build/deploy).

`loadtest:ccl:rest:ramp` only ramps the **read** path (`GET /campus-college-load`) — the submit-race and evaluate scenarios in `loadtest:ccl:rest` are deliberately one-shot/bounded by a fixed pre-seeded batch and can't sustain a climbing, indefinite VU count the way an idempotent GET can.

### Per-VU-level table

The ramp scripts write raw per-request results to `results/*.json` (tagged with the actual concurrent VU count at the moment each request fired) and gitignored. Turn that into a table — VU level as rows, latency/error metrics as columns:

```sh
npm run analyze:scheduler:ramp   # reads results/scheduler-ramp.json
npm run analyze:ccl:ramp         # reads results/ccl-ramp.json
```

Prints a table like:

```
┌─────────┬─────┬──────────┬──────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
│ (index) │ VUs │ Requests │ Errors % │ Avg ms │ P50 ms │ P90 ms │ P95 ms │ P99 ms │ Min ms │ Max ms │ ~Req/s │
├─────────┼─────┼──────────┼──────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤
│ 0       │ 10  │ ...      │ 0        │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │
│ 1       │ 25  │ ...      │ ...      │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │ ...    │
└─────────┴─────┴──────────┴──────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

and also writes a `.csv` next to the `.json` (same name) if you want to chart it in a spreadsheet. Only rows matching your `LOAD_TEST_RAMP_TARGETS` levels are included — the brief in-between VU counts seen while ramping between steps are excluded so the table only shows the stable "hold" periods.

Default target of 100 is sized for a local dev machine — `next dev` is single-process/unoptimized and local Supabase's Postgres/PostgREST have a fairly small default connection pool, so failures well before 100 usually mean you've hit local dev-tooling limits, not a real capacity ceiling. Raise `LOAD_TEST_RAMP_TARGETS` only if you're specifically trying to find where *that* breaks.

## Resetting test data

```sh
npm run reset
```

Deletes every `campus_college_load` row (and cascaded revisions/evaluations) created for the load tests, plus the synthetic academic terms used to work around the one-load-per-scope-per-term constraint. Seeded users/designations are left alone (they're reusable). `loadtest:ccl:rest` calls this automatically before each run.

## Where things live

- `base_users.csv` (gitignored) — your real base user roster; the single source of truth for who gets seeded.
- `.state/` (gitignored) — `seed-scope.json`, `personas.json`, `users.json`, `session.<persona>.json`, `eval-batch.json`. Regenerated by the scripts; safe to delete if you want a clean slate (rerun `npm run seed` afterward).
- `results/` (gitignored) — raw per-request JSON from the `:ramp` scripts (`scheduler-ramp.json`, `ccl-ramp.json`) plus the `.csv` the analyzer writes next to each. The non-ramp scripts don't write anywhere by default; pass k6's own `--out`/`--summary-export` flags if you want to persist those too.

## Safety notes

- Scripts refuse to run unless the Supabase URL is `localhost`/`127.0.0.1`, unless you explicitly set `LOAD_TEST_ALLOW_REMOTE=1`. Don't set that against a shared or production database — these scripts create and delete real rows.
- `.env` and `base_users.csv` are both gitignored. Real credentials never get committed.
