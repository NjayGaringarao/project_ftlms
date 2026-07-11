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

const scope = loadJson("../.state/seed-scope.json");
const session = loadJson("../.state/session.chair.json");

// Step/staircase ramp: climbs through RAMP_TARGETS (default 10,25,50,75,100),
// holding at each level for RAMP_STAGE_DURATION so you can see exactly which
// VU level error rate or p95 latency starts climbing at, in one run instead
// of manually rerunning scheduler.rest.js at each level.
export const options = {
  scenarios: {
    scheduler_ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: buildStepStages(RAMP_TARGETS, RAMP_STEP_DURATION, RAMP_STAGE_DURATION),
      gracefulRampDown: "5s",
    },
  },
  thresholds: thresholds.scheduler,
};

export default function () {
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, session.cookies);

  const url =
    `${BASE_URL}/scheduler?academic_term_id=${scope.academicTermId}` +
    `&sectionId=${scope.sectionId}`;
  // Tag every request with the actual concurrent VU count at the moment it
  // fired, so --out json=... output can be grouped into a per-VU-level table
  // afterward (see scripts/analyze-ramp-results.ts) instead of only getting
  // one aggregate number for the whole climbing run.
  const res = http.get(url, { jar, tags: { vu_level: String(exec.instance.vusActive) } });

  check(res, {
    "scheduler page 200": (r) => r.status === 200,
    "not redirected to login": (r) => !r.url.includes("/auth/login"),
  });
}
