export const BASE_URL = __ENV.SITE_URL || "http://localhost:3000";
export const SUPABASE_URL = __ENV.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
export const SUPABASE_ANON_KEY = __ENV.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || "";

export const VUS = Number(__ENV.LOAD_TEST_VUS || 10);
export const DURATION = __ENV.LOAD_TEST_DURATION || "30s";
export const ITERATIONS = Number(__ENV.LOAD_TEST_ITERATIONS || 3);

// Browser VUs are real headless Chrome instances (expensive), and k6's
// shared-iterations executor requires iterations >= vus, so this is a
// separate, deliberately small knob rather than reusing VUS (which is sized
// for cheap HTTP-only REST scenarios).
export const BROWSER_VUS = Math.min(Number(__ENV.LOAD_TEST_BROWSER_VUS || 2), ITERATIONS);

// Step/staircase ramp profile for the *.rest.ramp.js scripts: climbs VUs
// through each target in turn, holding at each level so you can see where
// error rate / p95 latency starts climbing, instead of manually rerunning a
// constant-VU script at each level by hand.
const DEFAULT_RAMP_TARGETS = [10, 25, 50, 75, 100];
export const RAMP_TARGETS = (__ENV.LOAD_TEST_RAMP_TARGETS || DEFAULT_RAMP_TARGETS.join(","))
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value > 0);

// How long to hold at each level (this is where the useful measurement
// happens) vs. how long to spend ramping between levels.
export const RAMP_STAGE_DURATION = __ENV.LOAD_TEST_RAMP_STAGE_DURATION || "30s";
export const RAMP_STEP_DURATION = __ENV.LOAD_TEST_RAMP_STEP_DURATION || "5s";

export const buildStepStages = (targets, stepDuration, stageDuration) => {
  const stages = [];
  targets.forEach((target) => {
    stages.push({ duration: stepDuration, target });
    stages.push({ duration: stageDuration, target });
  });
  return stages;
};

export const thresholds = {
  scheduler: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
    // Per-endpoint breakdown of the page-open replay (see lib/matrix-replay.js)
    // so a regression in the heavy RPC isn't hidden by the cheap page GET.
    "http_req_duration{endpoint:page}": ["p(95)<3000"],
    "http_req_duration{endpoint:rpc_matrices}": ["p(95)<3000"],
    "http_req_duration{endpoint:online_sessions}": ["p(95)<3000"],
    "http_req_duration{endpoint:course_offerings}": ["p(95)<3000"],
  },
  campusCollegeLoad: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

// Same headers the app's Supabase server client sends to PostgREST: the anon
// key identifies the project, the user JWT drives RLS/auth — so requests made
// with these headers exercise the exact same DB path as a server action.
export const postgrestHeaders = (accessToken) => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${accessToken}`,
});

// Builds a PostgREST GET URL, URL-encoding each query value the way
// supabase-js does (embed selects contain parens/commas that need encoding).
export const postgrestUrl = (table, params) => {
  const query = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
  return `${SUPABASE_URL}/rest/v1/${table}?${query}`;
};

// k6's open() only accepts string literals at parse time in most contexts,
// so callers pass the already-resolved path; this just centralizes the
// JSON.parse + basic "did the state file exist" error message.
export const loadJson = (path) => {
  let raw;
  try {
    raw = open(path);
  } catch {
    throw new Error(
      `Could not read ${path}. Run the relevant seed/mint-cookies npm script from load-tests/ first.`,
    );
  }
  return JSON.parse(raw);
};

export const applyCookies = (jar, baseUrl, cookies) => {
  cookies.forEach((cookie) => jar.set(baseUrl, cookie.name, cookie.value));
};
