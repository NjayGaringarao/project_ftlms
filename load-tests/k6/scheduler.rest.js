import { loadJson, thresholds, VUS, DURATION } from "./config.js";
import { runSchedulerPageOpen } from "./scheduler-replay.js";

const scope = loadJson("../.state/seed-scope.json");
const session = loadJson("../.state/session.chair.json");

export const options = {
  scenarios: {
    scheduler_rest: {
      executor: "constant-vus",
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: thresholds.scheduler,
};

// Each iteration replays a full authenticated page-open of /scheduler with a
// section selected — the SSR shell plus every PostgREST query the client-side
// server actions fire after hydration (see scheduler-replay.js). Requests are
// tagged per endpoint so the summary breaks out the heavy RPC separately.
export default function () {
  runSchedulerPageOpen({ scope, session });
}
