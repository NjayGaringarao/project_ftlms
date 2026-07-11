import exec from "k6/execution";
import {
  loadJson,
  thresholds,
  RAMP_TARGETS,
  RAMP_STEP_DURATION,
  RAMP_STAGE_DURATION,
  buildStepStages,
} from "./config.js";
import { runSchedulerPageOpen } from "./scheduler-replay.js";

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

// Each iteration replays a full page-open (see scheduler-replay.js). Every
// request is tagged with the actual concurrent VU count at the moment it
// fired plus its endpoint, so --out json=... output can be grouped into a
// per-VU-level, per-endpoint table afterward (scripts/analyze-ramp-results.ts)
// instead of one aggregate number for the whole climbing run.
export default function () {
  runSchedulerPageOpen({
    scope,
    session,
    extraTags: { vu_level: String(exec.instance.vusActive) },
  });
}
