import { createSupabaseAdmin } from "./lib/supabase-admin";
import { loadScopeOrThrow, saveScope } from "./lib/scope";
import { readState, statePath } from "./lib/state";
import { unlinkSync, existsSync } from "node:fs";

const main = async () => {
  const admin = createSupabaseAdmin();

  const scope = readState<ReturnType<typeof loadScopeOrThrow>>("seed-scope.json");
  if (!scope || !scope.batchTermIds || scope.batchTermIds.length === 0) {
    console.log("Nothing to reset (no batch terms recorded in .state/seed-scope.json).");
    return;
  }

  const termIds = scope.batchTermIds;
  const academicYearIds = scope.batchAcademicYearIds ?? [];

  // Deleting campus_college_load cascades to revisions, evaluations, and
  // evaluation attachments (all declared with `on delete cascade`).
  const { error: loadDeleteError, count: loadDeleteCount } = await admin
    .from("campus_college_load")
    .delete({ count: "exact" })
    .in("academic_term_id", termIds);
  if (loadDeleteError) throw loadDeleteError;
  console.log(`Deleted ${loadDeleteCount ?? 0} campus_college_load row(s).`);

  const { error: termDeleteError, count: termDeleteCount } = await admin
    .from("academic_term")
    .delete({ count: "exact" })
    .in("id", termIds);
  if (termDeleteError) throw termDeleteError;
  console.log(`Deleted ${termDeleteCount ?? 0} synthetic academic_term row(s).`);

  if (academicYearIds.length > 0) {
    const { error: yearDeleteError, count: yearDeleteCount } = await admin
      .from("academic_year")
      .delete({ count: "exact" })
      .in("id", academicYearIds);
    if (yearDeleteError) throw yearDeleteError;
    console.log(`Deleted ${yearDeleteCount ?? 0} synthetic academic_year row(s).`);
  }

  saveScope({ ...scope, batchTermIds: [], batchAcademicYearIds: [] });

  const evalBatchPath = statePath("eval-batch.json");
  if (existsSync(evalBatchPath)) unlinkSync(evalBatchPath);

  console.log("Reset complete.");
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
