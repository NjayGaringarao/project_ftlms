import type { SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "./lib/env";
import { createSupabaseAdmin } from "./lib/supabase-admin";
import { loadScopeOrThrow, saveScope, type SeedScope } from "./lib/scope";
import { readState, writeState } from "./lib/state";

type PersonaSeedResult = { userId: string; designationId: string; email: string };
type Personas = Record<"chair" | "campusDirector" | "dfi" | "vpaa", PersonaSeedResult>;

type EvaluationStep =
  | "CAMPUS_DIRECTOR"
  | "DIRECTOR_FOR_INSTRUCTION"
  | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

const STEPS: EvaluationStep[] = [
  "CAMPUS_DIRECTOR",
  "DIRECTOR_FOR_INSTRUCTION",
  "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS",
];

// academic_term has a global "no overlapping date ranges" exclusion constraint
// across every row in the table (see 302_constraints_academic_term.sql), so
// every synthetic term we create needs a date range nothing else will ever
// touch. Parking them far in the future with gaps between them is the
// simplest way to guarantee that.
const FAR_FUTURE_BASE = new Date("2090-01-01T00:00:00Z");
const termDatesForIndex = (index: number) => {
  const start = new Date(FAR_FUTURE_BASE);
  start.setUTCDate(start.getUTCDate() + index * 20);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 10);
  const toDateString = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toDateString(start), end: toDateString(end) };
};

// Both academic_year.code and academic_term.code are trigger-generated from
// (start_year, end_year) and (academic_year.code, term name) respectively —
// see 513_trigger_academic_term_code.sql / 514_trigger_academic_year_code.sql
// — and any `code` value we pass on insert is silently overwritten. So a
// single shared synthetic academic_year (same code every time) makes every
// term under it collide on academic_term_code_unique. One academic_year per
// term, each with a unique (start_year, end_year), keeps every generated
// code unique too.
const createSyntheticAcademicYear = async (
  admin: SupabaseClient,
  index: number,
): Promise<string> => {
  const startYear = 2090 + index;
  const { data, error } = await admin
    .from("academic_year")
    .insert({ start_year: startYear, end_year: startYear + 1 })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

const createSyntheticTerm = async (
  admin: SupabaseClient,
  academicYearId: string,
  dateIndex: number,
): Promise<string> => {
  const { start, end } = termDatesForIndex(dateIndex);
  const { data, error } = await admin
    .from("academic_term")
    .insert({
      academic_year_id: academicYearId,
      name: "FIRST SEMESTER",
      start,
      end,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
};

const createLoadAtStep = async (
  admin: SupabaseClient,
  scope: SeedScope,
  academicTermId: string,
  personas: Personas,
  targetStep: EvaluationStep,
): Promise<{ loadId: string; revisionId: string; termId: string }> => {
  const { data: load, error: loadError } = await admin
    .from("campus_college_load")
    .insert({
      campus_id: scope.campusId,
      college_id: scope.collegeId,
      academic_term_id: academicTermId,
    })
    .select("id")
    .single();
  if (loadError) throw loadError;

  const { data: revision, error: revisionError } = await admin
    .from("campus_college_load_revision")
    .insert({
      campus_college_load_id: load.id,
      revision_number: 1,
      snapshot: {},
      submitted_by_user_id: personas.chair.userId,
      submitted_by_designation_id: personas.chair.designationId,
    })
    .select("id")
    .single();
  if (revisionError) throw revisionError;

  // The revision insert's AFTER trigger unconditionally sets current_step to
  // CAMPUS_DIRECTOR (that's what a real first submission does) — to advance
  // further we have to walk it through the real evaluation chain, since each
  // evaluation insert is itself trigger-validated against the load's current step.
  if (targetStep === "DIRECTOR_FOR_INSTRUCTION" || targetStep === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS") {
    const { error } = await admin.from("campus_college_load_evaluation").insert({
      campus_college_load_revision_id: revision.id,
      step: "CAMPUS_DIRECTOR",
      designation_id: personas.campusDirector.designationId,
      evaluator_user_id: personas.campusDirector.userId,
      status: "APPROVED",
    });
    if (error) throw error;
  }

  if (targetStep === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS") {
    const { error } = await admin.from("campus_college_load_evaluation").insert({
      campus_college_load_revision_id: revision.id,
      step: "DIRECTOR_FOR_INSTRUCTION",
      designation_id: personas.dfi.designationId,
      evaluator_user_id: personas.dfi.userId,
      status: "APPROVED",
    });
    if (error) throw error;
  }

  return { loadId: load.id, revisionId: revision.id, termId: academicTermId };
};

const main = async () => {
  const env = loadEnv();
  const admin = createSupabaseAdmin();
  const scope = loadScopeOrThrow();
  const personas = readState<Personas>("personas.json");
  if (!personas) {
    throw new Error("No .state/personas.json found. Run `npm run seed` first.");
  }

  const batchSize = env.evalBatchSize;

  const batches: Record<EvaluationStep, { loadId: string; revisionId: string; termId: string }[]> = {
    CAMPUS_DIRECTOR: [],
    DIRECTOR_FOR_INSTRUCTION: [],
    VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: [],
  };
  const termIds: string[] = [];
  const academicYearIds: string[] = [];
  let dateIndex = 0;

  const nextSyntheticTerm = async (): Promise<string> => {
    const academicYearId = await createSyntheticAcademicYear(admin, dateIndex);
    const termId = await createSyntheticTerm(admin, academicYearId, dateIndex);
    dateIndex += 1;
    academicYearIds.push(academicYearId);
    termIds.push(termId);
    return termId;
  };

  for (const step of STEPS) {
    for (let i = 0; i < batchSize; i += 1) {
      const termId = await nextSyntheticTerm();
      const entry = await createLoadAtStep(admin, scope, termId, personas, step);
      batches[step].push(entry);
    }
    console.log(`[${step}] seeded ${batches[step].length} revision(s)`);
  }

  // One extra fresh (unsubmitted) load for the submit race/exactly-one-winner test.
  const raceTermId = await nextSyntheticTerm();
  const { data: raceLoad, error: raceLoadError } = await admin
    .from("campus_college_load")
    .insert({
      campus_id: scope.campusId,
      college_id: scope.collegeId,
      academic_term_id: raceTermId,
    })
    .select("id")
    .single();
  if (raceLoadError) throw raceLoadError;

  writeState("eval-batch.json", {
    batches,
    raceTarget: {
      loadId: raceLoad.id,
      academicTermId: raceTermId,
      campusId: scope.campusId,
      collegeId: scope.collegeId,
    },
  });

  saveScope({
    ...scope,
    batchTermIds: [...(scope.batchTermIds ?? []), ...termIds],
    batchAcademicYearIds: [...(scope.batchAcademicYearIds ?? []), ...academicYearIds],
  });
  console.log(`Seed complete. Wrote .state/eval-batch.json (${termIds.length} synthetic terms).`);
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
