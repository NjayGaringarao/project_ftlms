import { createSupabaseAdmin } from "./lib/supabase-admin";
import { saveScope } from "./lib/scope";
import { readState, statePath } from "./lib/state";
import { cleanupScheduleRace, type ScheduleRaceScope } from "./lib/schedule-race";
import { unlinkSync, existsSync } from "node:fs";

const main = async () => {
  const admin = createSupabaseAdmin();

  let scope = readState<ScheduleRaceScope>("seed-scope.json");
  if (!scope) {
    console.log("Nothing to reset (no .state/seed-scope.json).");
    return;
  }

  const termIds = scope.batchTermIds ?? [];
  const academicYearIds = scope.batchAcademicYearIds ?? [];

  if (termIds.length > 0) {
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
  } else {
    console.log("No batch terms recorded — skipping campus_college_load cleanup.");
  }

  // Scheduler write-race rows (see seed-schedule-race.ts).
  scope = await cleanupScheduleRace(admin, scope);

  saveScope({ ...scope, batchTermIds: [], batchAcademicYearIds: [] });

  for (const stateFile of ["eval-batch.json", "schedule-race.json"]) {
    const path = statePath(stateFile);
    if (existsSync(path)) unlinkSync(path);
  }

  console.log("Reset complete.");
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
