# FTLMS Load Testing

k6 load tests for two flows:

- **Scheduler** (`/scheduler`) — DB-read-heavy page backed by the `get_scheduler_matrices()` RPC, plus a write-path race scenario for session creation.
- **Campus-college load submit/evaluate** (`/campus-college-load`) — DB-write / trigger-contention-heavy proposal workflow.

Each flow has two variants:

- **`.browser.js`** — drives a real headless Chrome through the actual login form and app UI. Highest fidelity, lower scale.
- **`.rest.js`** — cookie/token-injected plain HTTP. No browser, scales much higher. Reads and writes go straight to Supabase PostgREST with the impersonated user's JWT rather than replaying Next.js Server Actions (their wire format is build-specific and not safely rerunnable — see comments in `campus-college-load.browser.js`). Because the app's server actions are themselves thin wrappers around the same PostgREST calls, this exercises the identical DB path.

### What the scheduler REST test actually replays

Opening `/scheduler` with a section selected does almost no data work in the Server Component (it only fetches terms). The real load — the `get_scheduler_matrices()` RPC, the online-session selects, the course-offerings query — fires *after hydration*, from client-side `useEffect`s calling server actions. A plain page GET never triggers any of it. So `scheduler-matrix.rest.js` (via `k6/lib/matrix-replay.js`) replays the full page-open: the SSR page GET **plus** each PostgREST query those server actions issue, tagged per endpoint (`page`, `rpc_matrices`, `online_sessions`, `course_offerings`) with per-endpoint thresholds, so the heavy RPC is measured separately from the cheap page shell. Each replayed query names the app function it mirrors — if that function's select changes, update the constant in `lib/matrix-replay.js`.

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
npm run loadtest:scheduler:matrix:browser
npm run loadtest:scheduler:matrix:rest
npm run loadtest:scheduler:session:rest
npm run loadtest:ccl:browser
npm run loadtest:ccl:rest
```

Override load shape via env vars (in `.env` or inline): `LOAD_TEST_VUS`, `LOAD_TEST_DURATION` (REST scenarios), `LOAD_TEST_ITERATIONS` (browser scenarios).

`loadtest:ccl:rest` runs `reset` and `seed:eval-batch` first every time — the campus-college-load workflow is stateful (a revision/evaluation can't be replayed), so each run needs a fresh batch of pre-queued data. Roughly size the batch (`LOAD_TEST_EVAL_BATCH_SIZE` in `.env`) as:

```
batch_size ≈ VUS * DURATION_SECONDS / expected_seconds_per_iteration
```

`loadtest:ccl:rest` has two parts:
- A **submit race test**: many VUs simultaneously try to submit the same fresh load. A DB uniqueness constraint guarantees exactly one wins — the test asserts exactly one 201 across the run (`submit_race_wins: count==1` threshold), that losers fail cleanly (4xx), and that nobody gets a 5xx.
- An **evaluate load test**: VUs consume distinct pre-seeded revisions at each evaluation step (Campus Director / Director for Instruction / VPAA), exercising the workflow's step-validation triggers at volume. Every 5th Campus Director evaluation posts `RETURNED` (with a comment) instead of `APPROVED`, so the return branch of the workflow trigger is exercised too.

**Snapshot payloads are realistic**, not empty: `seed:eval-batch` builds a snapshot fixture from the scope's real data (`scripts/lib/snapshot-fixture.ts` → `.state/snapshot-fixture.json`, size logged at seed time) and both the seeded revisions and the k6 submit race use it — so submit latency includes the real JSONB write cost a `buildCampusCollegeLoadSnapshot()` payload incurs. The local seeds ship no class/session rows, so when the scope has no class data the builder synthesizes a plausible baseline with the same shape; set `LOAD_TEST_SNAPSHOT_MULTIPLIER` (default 1) to duplicate faculty/class entries further toward production-scale sizes.

### Scheduler write-path race (`loadtest:scheduler:session:rest`)

The scheduler's session-creation conflict detection is **app-side only** (`session-actions/conflicts.ts` — there is no DB exclusion constraint on overlapping sessions), i.e. a check-then-insert sequence. This scenario seeds an isolated synthetic class/course on the real scope section (`seed:schedule-race`), then has every VU replay the app's `createClassSession()` flow — conflict-window reads, the same in-JS overlap check, then the `session` + `session_class` inserts — against the same room/day/time window.

**It measures the race; it does not fail on it.** With an airtight guard, exactly one VU would win; in practice several VUs can pass the check before any insert is visible and double-book the slot. The run reports `session_insert_wins` / `session_conflict_skips`, and teardown logs how many sessions ended up occupying the window. A count > 1 documents the race — the fix, if ever wanted, is a DB exclusion constraint, not a test change. Race rows are cleaned up by `npm run reset` (and re-seeding cleans the previous run's rows first).

## Finding the breaking point (ramp tests)

```sh
npm run loadtest:scheduler:matrix:rest:ramp    # matrix query, via the app, up to 150+ VUs
npm run loadtest:scheduler:session:rest:ramp   # session write, via the app, up to 150+ VUs, pooled
npm run loadtest:ccl:rest:ramp                 # GET /campus-college-load
```

Instead of manually rerunning a script at increasing `LOAD_TEST_VUS` values, these climb through a staircase of VU levels *in one run* — `LOAD_TEST_RAMP_TARGETS` (default `10,25,50,75,100`), holding at each level for `LOAD_TEST_RAMP_STAGE_DURATION` (default `30s`) with `LOAD_TEST_RAMP_STEP_DURATION` (default `5s`) to ramp between levels. Watch k6's live output for which level `http_req_duration` (p95) or `http_req_failed` starts climbing — that's your capacity ceiling against a local `next dev` server + local Supabase (not representative of a production build/deploy).

Each of the three ramp scripts measures exactly **one** thing, deliberately uniform with each other. That's also why the CCL and scheduler-session write scenarios in `loadtest:ccl:rest` / `loadtest:scheduler:session:rest` aren't ramped directly — they're one-shot/bounded by a fixed pre-seeded batch or target and can't sustain a climbing, indefinite VU count the way an idempotent read (or a large *pool* of write targets — see below) can.

### Going through the real app, not just Supabase — `/api/load-test/*`

The scheduler read and write ramps don't call Supabase directly. Both `get_scheduler_matrices()` and `createSessionFromOffering()`/`createClassSession()` are normally invoked from the client via Next.js **Server Actions**, and Server Actions can't be safely replayed as raw HTTP for a load test — their wire format (the `Next-Action` header + a React Flight-encoded body) is build-specific and changes on every `next build`/dev-server restart. So instead of bypassing the app and replaying the equivalent Supabase calls directly (which is what `campus-college-load.rest.js`/`.rest.ramp.js` still do — see their comments), two small dedicated routes wrap the exact same server-side functions behind stable plain HTTP:

- `web-app/src/app/api/load-test/scheduler-matrices/route.ts` → calls `getSchedulerMapperMatrices()`, exactly as `schedule-mapper.tsx`'s `useEffect` does.
- `web-app/src/app/api/load-test/schedule-session/route.ts` → calls `createSessionFromOffering()`, exactly as `handleConfirmSchedule()` does.

`scheduler-matrix.rest.ramp.js` and `scheduler-session.rest.ramp.js` hit these routes (cookie-authenticated, same as a real browser session) instead of Supabase, so the ramp exercises real Next.js request handling + auth + the real function + RLS, at up to 150+ concurrent VUs — something a real browser can't do cheaply.

**Both routes are inert outside local development** — they 404 whenever `NODE_ENV === "production"`, regardless of what else ships. `next dev` sets `NODE_ENV=development` automatically, so this needs no extra config locally; just don't be tempted to relax the check.

### Scheduler write-path ramp (`loadtest:scheduler:session:rest:ramp`)

A single race target (what `loadtest:scheduler:session:rest` uses) only has one meaningful "winner" for an entire run — after that, every later iteration is a guaranteed conflict and there's nothing left to measure. So the ramp variant round-robins across a **pool** of N pre-seeded targets (`npm run seed:schedule-race-pool`, size `LOAD_TEST_SCHEDULE_RACE_POOL_SIZE`, default `8`) instead of racing one fixed target. Keep the pool well below your VU ceiling — a pool much smaller than the VU count is what produces real multi-VU contention on the same target as concurrency climbs; a 1:1 VU:target ratio would just be N independent single-writer inserts, not a race. Each pool entry gets its own dedicated time slot (see `seed-schedule-race-pool.ts` for why — all entries share the same synthetic faculty, so entries sharing a time slot would incorrectly reject each other as a faculty double-booking) — that puts a practical ceiling on pool size within one evening window; the seed script tells you if you've set it too high. `createSessionFromOffering()` needs a pre-existing `course_utilization` row to attach the session to (the "offering"); the pool seed script creates one per target in the same placeholder state a real fresh offering would be in, so this works unmodified. Teardown logs a per-target double-booking summary the same way the single-target test does.

### Stable single-user baseline (browser, VU=1, repeated)

```sh
npm run loadtest:scheduler:matrix:browser:repeat   # matrix query, real page navigation
npm run loadtest:scheduler:session:browser:repeat  # session write, via a real browser's fetch()
```

The `/api/load-test/*` ramps above give you real-app timing at high concurrency, but they still bypass actual page rendering/hydration. These two run a single VU through `LOAD_TEST_BROWSER_REPEAT_ITERATIONS` (default `20`) repeats to get a stable average with real browser overhead included:

- **Matrix query**: logs in and navigates `/scheduler` for real, waiting for the RPC-backed grid to render — the real Server Action fires exactly as it does for an actual user, not through the `/api/load-test/` route. Login time is excluded from the timed window (a fixed cost that would otherwise skew the average); only the navigate-to-grid-loaded portion is measured (`matrix_load_ms`).
- **Session write**: logs in, then repeatedly calls `/api/load-test/schedule-session` via `fetch()` **from inside the real browser page** (`page.evaluate(...)`) — real cookies, real network stack, but not a literal drag-and-drop simulation on the schedule grid (that would require automating three picker dialogs plus a grid gesture; out of scope for now). Metric: `session_write_ms`.

Compare these against the VU=10 row of the corresponding `/api/load-test/*` ramp — if they disagree wildly, the dedicated route may not be representative of real page timing.

### Per-VU-level table

The ramp scripts write raw per-request results to `results/*.json` (tagged with the actual concurrent VU count at the moment each request fired), gitignored. Turn that into a table — VU level as rows, latency/error metrics as columns:

```sh
npm run analyze:scheduler:matrix:ramp     # reads results/scheduler-matrix-ramp.json
npm run analyze:scheduler:session:ramp    # reads results/scheduler-session-ramp.json
npm run analyze:ccl:ramp                  # reads results/ccl-ramp.json
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

If a script is tagged with more than one distinct `endpoint` (none of the three `.rest.ramp.js` scripts are, by design — see above), the analyzer instead prints **one table per endpoint** and writes one CSV per endpoint (`<name>.<endpoint>.csv`), since averaging a cheap request with a heavy one in the same row would hide where the heavy one's ceiling actually is.

Default target of 100 is sized for a local dev machine — `next dev` is single-process/unoptimized and local Supabase's Postgres/PostgREST have a fairly small default connection pool, so failures well before 100 usually mean you've hit local dev-tooling limits, not a real capacity ceiling. Raise `LOAD_TEST_RAMP_TARGETS` only if you're specifically trying to find where *that* breaks.

**If a ramp run gets interrupted (Ctrl+C, killed process, crashed dev server) partway through**, don't reuse its `results/*.json` — k6 appends to an existing output file rather than truncating it, so a partial run followed by a fresh run can concatenate mid-write and corrupt the file (the analyzer will fail with a cryptic `RangeError`/`Invalid string length`, or the file will be implausibly large for how long the run actually took). The `loadtest:*:ramp` (and `*:browser:repeat`) npm scripts already delete their target file before each run for exactly this reason; if you invoke `k6 run --out json=...` directly, delete the old file yourself first.

### Single-row stable-average table (browser repeat)

```sh
npm run analyze:scheduler:matrix:browser:repeat    # reads results/scheduler-matrix-browser-repeat.json
npm run analyze:scheduler:session:browser:repeat   # reads results/scheduler-session-browser-repeat.json
```

Same idea as the per-VU-level table, but there's only one VU level (always 1), so this prints (and writes a `.csv` for) a single summary row — request count, success rate, and the avg/p50/p90/p95/p99/min/max of that script's timed window (`matrix_load_ms` / `session_write_ms`), not `http_req_duration` (browser scripts don't populate that — no plain `k6/http` calls).

## Resetting test data

```sh
npm run reset
```

Deletes every `campus_college_load` row (and cascaded revisions/evaluations) created for the load tests, the synthetic academic terms used to work around the one-load-per-scope-per-term constraint, and both schedule-race scenarios' synthetic course/class/sessions (the single target from `seed:schedule-race` and the pool from `seed:schedule-race-pool`, tracked and cleaned up independently). Seeded users/designations are left alone (they're reusable). `loadtest:ccl:rest` calls this automatically before each run; the schedule-race scripts also clean up their own previous run automatically when reseeded.

## Where things live

- `base_users.csv` (gitignored) — your real base user roster; the single source of truth for who gets seeded.
- `.state/` (gitignored) — `seed-scope.json`, `personas.json`, `users.json`, `session.<persona>.json`, `eval-batch.json`, `snapshot-fixture.json`, `schedule-race.json`, `schedule-race-pool.json`, `schedule-race-pool-scope.json`. Regenerated by the scripts; safe to delete if you want a clean slate (rerun `npm run seed` afterward).
- `results/` (gitignored) — raw per-request JSON from the `:ramp` and `:browser:repeat` scripts (`scheduler-matrix-ramp.json`, `scheduler-session-ramp.json`, `ccl-ramp.json`, `scheduler-matrix-browser-repeat.json`, `scheduler-session-browser-repeat.json`) plus the `.csv`/`.<endpoint>.csv` the analyzers write next to each. The non-ramp/non-repeat scripts don't write anywhere by default; pass k6's own `--out`/`--summary-export` flags if you want to persist those too.
- `web-app/src/app/api/load-test/` — the two dedicated routes `scheduler-matrix.rest.ramp.js`/`scheduler-session.rest.ramp.js` hit (see "Going through the real app" above). Real application source, not test tooling — 404 outside local dev.

## Safety notes

- Scripts refuse to run unless the Supabase URL is `localhost`/`127.0.0.1`, unless you explicitly set `LOAD_TEST_ALLOW_REMOTE=1`. Don't set that against a shared or production database — these scripts create and delete real rows.
- `.env` and `base_users.csv` are both gitignored. Real credentials never get committed.
- `web-app/src/app/api/load-test/*` routes 404 unless `NODE_ENV !== "production"`. They still require a valid authenticated session (same `getCurrentUser()` check the rest of the app uses) even in development — they're not an open door, just a dev-only convenience.
