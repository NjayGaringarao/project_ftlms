import http from "k6/http";
import { check } from "k6";
import { scenario } from "k6/execution";
import { SharedArray } from "k6/data";
import { SUPABASE_URL, SUPABASE_ANON_KEY, loadJson, thresholds, VUS } from "./config.js";

const evalBatch = loadJson("../.state/eval-batch.json");
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
  thresholds: thresholds.campusCollegeLoad,
};

const postgrestHeaders = (accessToken) => ({
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${accessToken}`,
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
      snapshot: {},
      submitted_by_user_id: chairSession.userId,
      submitted_by_designation_id: chairSession.designationId,
    }),
    { headers: postgrestHeaders(chairSession.accessToken), responseCallback: raceResponseCallback },
  );

  check(res, {
    "submit race: 201 (won) or 4xx (lost cleanly)": (r) =>
      r.status === 201 || (r.status >= 400 && r.status < 500),
    "submit race: never 5xx": (r) => r.status < 500,
  });
}

const evaluate = (session, batch, step, status) => {
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
    }),
    { headers: postgrestHeaders(session.accessToken) },
  );

  check(res, { [`evaluate ${step}: 201`]: (r) => r.status === 201 });
};

export function evaluateCampusDirector() {
  evaluate(campusDirectorSession, campusDirectorBatch, "CAMPUS_DIRECTOR", "APPROVED");
}

export function evaluateDfi() {
  evaluate(dfiSession, dfiBatch, "DIRECTOR_FOR_INSTRUCTION", "APPROVED");
}

export function evaluateVpaa() {
  evaluate(vpaaSession, vpaaBatch, "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS", "APPROVED");
}
