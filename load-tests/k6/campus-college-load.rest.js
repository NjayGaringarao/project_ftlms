import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";
import { SharedArray } from "k6/data";
import { Counter } from "k6/metrics";
import {
  SUPABASE_URL,
  loadJson,
  postgrestHeaders,
  thresholds,
  VUS,
} from "./config.js";

const evalBatch = loadJson("../.state/eval-batch.json");
// Realistic snapshot payload built from the scope's real data at seed time
// (see scripts/lib/snapshot-fixture.ts) — a real submit writes a full JSONB
// snapshot, so racing with `{}` would understate the write cost.
const snapshotFixture = loadJson("../.state/snapshot-fixture.json");
const chairSession = loadJson("../.state/session.chair.json");
const campusDirectorSession = loadJson("../.state/session.campusDirector.json");
const dfiSession = loadJson("../.state/session.dfi.json");
const vpaaSession = loadJson("../.state/session.vpaa.json");

const campusDirectorBatch = new SharedArray("cd-batch", () => evalBatch.batches.CAMPUS_DIRECTOR);
const dfiBatch = new SharedArray("dfi-batch", () => evalBatch.batches.DIRECTOR_FOR_INSTRUCTION);
const vpaaBatch = new SharedArray(
  "vpaa-batch",
  () => evalBatch.batches.VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS,
);

const raceIterations = Math.min(VUS, 20);

// Losing the submit race with a clean 4xx is the correct, expected outcome
// (see the check below) — without this, k6's default http_req_failed metric
// counts every losing 4xx as a "failure" and trips the threshold even when
// the race behaved exactly right.
const raceResponseCallback = http.expectedStatuses(201, { min: 400, max: 499 });

const submitRaceWins = new Counter("submit_race_wins");

// Every Nth Campus Director evaluation returns the load instead of approving
// it, so the RETURNED branch of trg_apply_campus_college_load_evaluation
// (status/current_step reset to RETURNED/PROGRAM_CHAIR) is exercised too.
const RETURN_EVERY_NTH = 5;

export const options = {
  scenarios: {
    submit_race: {
      executor: "shared-iterations",
      vus: raceIterations,
      iterations: raceIterations,
      exec: "submitRace",
      startTime: "0s",
      maxDuration: "30s",
    },
    evaluate_campus_director: {
      executor: "shared-iterations",
      vus: Math.min(VUS, campusDirectorBatch.length) || 1,
      iterations: campusDirectorBatch.length,
      exec: "evaluateCampusDirector",
      startTime: "35s",
      maxDuration: "60s",
    },
    evaluate_dfi: {
      executor: "shared-iterations",
      vus: Math.min(VUS, dfiBatch.length) || 1,
      iterations: dfiBatch.length,
      exec: "evaluateDfi",
      startTime: "35s",
      maxDuration: "60s",
    },
    evaluate_vpaa: {
      executor: "shared-iterations",
      vus: Math.min(VUS, vpaaBatch.length) || 1,
      iterations: vpaaBatch.length,
      exec: "evaluateVpaa",
      startTime: "35s",
      maxDuration: "60s",
    },
  },
  thresholds: {
    ...thresholds.campusCollegeLoad,
    // The race's core claim: the unique constraint lets exactly one submit in.
    submit_race_wins: ["count==1"],
  },
};

const writeHeaders = (accessToken) => ({
  ...postgrestHeaders(accessToken),
  Prefer: "return=representation",
});

// All VUs in this scenario race to submit revision_number=1 for the same
// pre-seeded DRAFT load. The `campus_college_load_revision_number_unique`
// constraint (campus_college_load_id, revision_number) guarantees exactly one
// insert wins; everyone else should get a clean conflict, not a deadlock or
// partial write.
export function submitRace() {
  const res = http.post(
    `${SUPABASE_URL}/rest/v1/campus_college_load_revision`,
    JSON.stringify({
      campus_college_load_id: evalBatch.raceTarget.loadId,
      revision_number: 1,
      snapshot: snapshotFixture,
      submitted_by_user_id: chairSession.userId,
      submitted_by_designation_id: chairSession.designationId,
    }),
    {
      headers: writeHeaders(chairSession.accessToken),
      responseCallback: raceResponseCallback,
    },
  );

  if (res.status === 201) submitRaceWins.add(1);

  check(res, {
    "submit race: 201 (won) or 4xx (lost cleanly)": (r) =>
      r.status === 201 || (r.status >= 400 && r.status < 500),
    "submit race: never 5xx": (r) => r.status < 500,
  });
}

const evaluate = (session, batch, step, status, comment = null) => {
  const index = scenario.iterationInTest % batch.length;
  const target = batch[index];

  const res = http.post(
    `${SUPABASE_URL}/rest/v1/campus_college_load_evaluation`,
    JSON.stringify({
      campus_college_load_revision_id: target.revisionId,
      step,
      designation_id: session.designationId,
      evaluator_user_id: session.userId,
      status,
      comment,
    }),
    { headers: writeHeaders(session.accessToken) },
  );

  check(res, { [`evaluate ${step}: 201`]: (r) => r.status === 201 });
};

export function evaluateCampusDirector() {
  // A RETURNED evaluation requires a comment (enforced by the app UI; the
  // trigger requires it only for system-generated returns, but sending one
  // matches what the real action posts).
  const shouldReturn =
    scenario.iterationInTest % RETURN_EVERY_NTH === RETURN_EVERY_NTH - 1;
  if (shouldReturn) {
    evaluate(
      campusDirectorSession,
      campusDirectorBatch,
      "CAMPUS_DIRECTOR",
      "RETURNED",
      "Load test: returned for revision.",
    );
    return;
  }
  evaluate(campusDirectorSession, campusDirectorBatch, "CAMPUS_DIRECTOR", "APPROVED");
}

export function evaluateDfi() {
  evaluate(dfiSession, dfiBatch, "DIRECTOR_FOR_INSTRUCTION", "APPROVED");
}

export function evaluateVpaa() {
  evaluate(vpaaSession, vpaaBatch, "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS", "APPROVED");
}
