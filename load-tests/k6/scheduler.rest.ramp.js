import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
import {
  SUPABASE_URL,
  loadJson,
  postgrestHeaders,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";

const scope = loadJson("../.state/seed-scope.json");
const session = loadJson("../.state/session.chair.json");

// Step/staircase ramp against just get_scheduler_matrices() — the single
// heaviest read in the scheduler flow, and the one the original brief for
// this test named ("DB-read-heavy page backed by the get_scheduler_matrices()
// RPC"). One request per iteration, one table out — deliberately uniform with
// campus-college-load.rest.ramp.js's single GET, instead of the 4-endpoint
// breakdown scheduler.rest.js produces. That full page-open replay (page
// shell + RPC + online-sessions + course-offerings) still exists in
// k6/scheduler-replay.js / scheduler.rest.js if you want it back.
export const options = {
  scenarios: {
    scheduler_ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: buildStepStages(RAMP_TARGETS, RAMP_STEP_DURATION, RAMP_STAGE_DURATION),
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function () {
  const res = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_scheduler_matrices`,
    JSON.stringify({
      academic_term_id: scope.academicTermId,
      section_id: scope.sectionId,
      faculty_id: null,
      room_id: null,
    }),
    {
      headers: postgrestHeaders(session.accessToken),
      tags: { vu_level: String(exec.instance.vusActive) },
    },
  );

  check(res, {
    "matrices rpc 200": (r) => r.status === 200,
    "matrices rpc has section matrix": (r) => {
      try {
        const payload = JSON.parse(r.body);
        return payload && Array.isArray(payload.section);
      } catch {
        return false;
      }
    },
  });
}
