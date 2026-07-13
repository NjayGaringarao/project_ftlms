import http from "k6/http";
import { check } from "k6";
import exec from "k6/execution";
import { Counter } from "k6/metrics";
import {
  BASE_URL,
  applyCookies,
  loadJson,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";
import { reportDoubleBookings } from "./lib/session-race-replay.js";

const pool = loadJson("../.state/schedule-race-pool.json");
const session = loadJson("../.state/session.chair.json");

const sessionCreateWins = new Counter("session_insert_wins");
const sessionCreateConflicts = new Counter("session_conflict_skips");

// Losing the race with a clean 409 is the correct, expected outcome (see the
// check below) — without this, k6's default http_req_failed metric counts
// every losing 409 as a "failure" and trips the threshold even when the race
// behaved exactly right.
const raceResponseCallback = http.expectedStatuses(201, 409);

// Ramping version of the write-path race test, routed through the real app
// layer via /api/load-test/schedule-session (wraps createSessionFromOffering()
// -> createClassSession(), the exact function handleConfirmSchedule() calls)
// instead of replaying the conflict-check-then-insert sequence via direct
// PostgREST calls — compare scheduler-session.rest.js, which still does the
// direct-PostgREST version. See lib/session-race-replay.js for why this race
// exists at all (no DB-level guard on session overlap) and
// web-app/src/app/api/load-test/schedule-session/route.ts for the route.
//
// VUs round-robin through a pool of N pre-seeded targets (npm run
// seed:schedule-race-pool) instead of racing one fixed target — a single
// target only has one meaningful "winner" for the whole run, after which
// every later iteration is a guaranteed conflict and there's nothing left to
// measure.
export const options = {
  scenarios: {
    session_create_race_ramp: {
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
  const race = pool[exec.scenario.iterationInTest % pool.length];
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, session.cookies);
  const tags = { vu_level: String(exec.instance.vusActive) };

  const res = http.post(
    `${BASE_URL}/api/load-test/schedule-session`,
    JSON.stringify({
      academicTermId: race.academicTermId,
      sectionId: race.sectionId,
      courseUtilizationId: race.courseUtilizationId,
      facultyId: race.facultyUserId,
      roomId: race.roomId,
      day: race.day,
      startTime: race.startTime,
      endTime: race.endTime,
      type: "Lecture",
    }),
    {
      jar,
      headers: { "Content-Type": "application/json" },
      tags,
      responseCallback: raceResponseCallback,
    },
  );

  check(res, {
    "schedule-session 201 (won) or 409 (lost cleanly)": (r) => r.status === 201 || r.status === 409,
    "schedule-session never 5xx": (r) => r.status < 500,
  });

  if (res.status === 201) sessionCreateWins.add(1, tags);
  if (res.status === 409) sessionCreateConflicts.add(1, tags);
}

export function teardown() {
  let totalOverlapping = 0;
  pool.forEach((race, index) => {
    totalOverlapping += reportDoubleBookings({ race, session, label: `pool[${index}]` });
  });
  console.log(
    `[write-race] pool summary: ${totalOverlapping} total occupying session(s) across ` +
      `${pool.length} target(s).`,
  );
}
