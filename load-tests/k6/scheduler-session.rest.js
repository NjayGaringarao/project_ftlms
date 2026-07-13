import { loadJson, VUS } from "./config.js";
import { attemptSessionCreate, reportDoubleBookings } from "./lib/session-race-replay.js";

// Scheduler WRITE-path race: every VU simultaneously replays the app's
// createClassSession() flow for the SAME class/room/day/time window — see
// lib/session-race-replay.js for the full mechanics and why this is a genuine
// race (no DB-level guard on session overlap). This scenario measures that
// race window at a single, fixed concurrency level; for a VU-climbing
// version see scheduler-session.rest.ramp.js.

const race = loadJson("../.state/schedule-race.json");
const session = loadJson("../.state/session.chair.json");

const raceIterations = Math.min(VUS, 20);

export const options = {
  scenarios: {
    session_create_race: {
      executor: "shared-iterations",
      vus: raceIterations,
      iterations: raceIterations,
      maxDuration: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function () {
  attemptSessionCreate({ race, session });
}

export function teardown() {
  reportDoubleBookings({ race, session });
}
