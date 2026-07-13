import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
import {
  BASE_URL,
  applyCookies,
  loadJson,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";

const scope = loadJson("../.state/seed-scope.json");
const session = loadJson("../.state/session.chair.json");

// Step/staircase ramp against /api/load-test/scheduler-matrices — a
// dev-only route (404s outside NODE_ENV!=="production") that server-side
// calls the exact same getSchedulerMapperMatrices() function
// schedule-mapper.tsx's useEffect calls via a "use server" action. Going
// through the real app layer (auth, this function, RLS) rather than
// replaying the get_scheduler_matrices() RPC directly against Supabase —
// see web-app/src/app/api/load-test/scheduler-matrices/route.ts and
// load-tests/README.md for why a dedicated route exists instead of trying to
// replay the Server Action's wire format. One request per iteration, one
// table out — deliberately uniform with campus-college-load.rest.ramp.js's
// single GET.
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
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, session.cookies);

  const res = http.post(
    `${BASE_URL}/api/load-test/scheduler-matrices`,
    JSON.stringify({
      academicTermId: scope.academicTermId,
      sectionId: scope.sectionId,
      facultyId: null,
      roomId: null,
    }),
    {
      jar,
      headers: { "Content-Type": "application/json" },
      tags: { vu_level: String(exec.instance.vusActive) },
    },
  );

  check(res, {
    "matrices route 200": (r) => r.status === 200,
    "matrices route has section matrix": (r) => {
      try {
        const payload = JSON.parse(r.body);
        return Boolean(payload?.data) && Array.isArray(payload.data.section);
      } catch {
        return false;
      }
    },
  });
}
