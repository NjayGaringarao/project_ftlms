import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
import {
  BASE_URL,
  applyCookies,
  loadJson,
  thresholds,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";

const chairSession = loadJson("../.state/session.chair.json");

// This ramps the READ path only (GET /campus-college-load), not the
// submit/evaluate writes in campus-college-load.rest.js. Those are
// deliberately bounded: submit_race is a one-shot race against a single
// pre-seeded row, and evaluate_* each consume a fixed pre-seeded batch
// exactly once — neither can sustain an indefinite climbing VU count the
// way an idempotent GET can. The list page load is the part of this flow
// that's actually meaningful to ramp.
export const options = {
  scenarios: {
    ccl_read_ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: buildStepStages(RAMP_TARGETS, RAMP_STEP_DURATION, RAMP_STAGE_DURATION),
      gracefulRampDown: "5s",
    },
  },
  thresholds: thresholds.campusCollegeLoad,
};

export default function () {
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, chairSession.cookies);

  // Tag every request with the actual concurrent VU count at the moment it
  // fired, so --out json=... output can be grouped into a per-VU-level table
  // afterward (see scripts/analyze-ramp-results.ts).
  const res = http.get(`${BASE_URL}/campus-college-load`, {
    jar,
    tags: { vu_level: String(exec.instance.vusActive) },
  });

  check(res, {
    "campus-college-load page 200": (r) => r.status === 200,
    "not redirected to login": (r) => !r.url.includes("/auth/login"),
  });
}
