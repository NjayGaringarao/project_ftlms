import exec from "k6/execution";
import {
  loadJson,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";
import { attemptSessionCreate, reportDoubleBookings } from "./scheduler-race-replay.js";

const pool = loadJson("../.state/schedule-race-pool.json");
const session = loadJson("../.state/session.chair.json");

// Ramping version of the write-path race test (see scheduler-sessions.rest.js
// and scheduler-race-replay.js for why this race exists at all — no DB-level
// guard on session overlap). VUs round-robin through a pool of N pre-seeded
// targets (npm run seed:schedule-race-pool) instead of racing one fixed
// target: a single target only has one meaningful "winner" for the whole
// run — after that, every later iteration is a guaranteed conflict-skip and
// there's nothing left to measure. A pool keeps producing genuine multi-VU
// contention throughout the climb — at higher VU counts, more concurrent
// VUs land on the same still-open target at once, which is exactly the
// effect worth seeing.
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
  attemptSessionCreate({
    race,
    session,
    extraTags: { vu_level: String(exec.instance.vusActive) },
  });
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
