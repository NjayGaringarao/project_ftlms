import { loadEnv } from "./lib/env";
import { createSupabaseAdmin } from "./lib/supabase-admin";
import { loadScopeOrThrow, saveScope } from "./lib/scope";
import { readState, writeState } from "./lib/state";
import { cleanupScheduleRace, type ScheduleRaceScope } from "./lib/schedule-race";

type PersonaSeedResult = { userId: string; designationId: string; email: string };
type Personas = Record<"chair" | "campusDirector" | "dfi" | "vpaa", PersonaSeedResult>;

// Seeds an isolated target for k6/scheduler-session.rest.js: a synthetic
// course + class linked to the real scope section, with the chair as the
// assigned faculty and a real room, so concurrent VUs can race the app's
// check-then-insert session-creation flow without touching real seed data.
// A fixed evening window keeps the target slot clear of any seeded sessions
// (seed data schedules daytime classes).
const RACE_DAY = "Friday";
const RACE_START_TIME = "19:00";
const RACE_END_TIME = "21:00";

const main = async () => {
  loadEnv();
  const admin = createSupabaseAdmin();
  let scope = loadScopeOrThrow() as ScheduleRaceScope;
  const personas = readState<Personas>("personas.json");
  if (!personas) {
    throw new Error("No .state/personas.json found. Run `npm run seed` first.");
  }

  // Remove any previous run's race rows first — leftover sessions in the
  // target window would make every VU's conflict check trip and skip.
  scope = await cleanupScheduleRace(admin, scope);

  const { data: course, error: courseError } = await admin
    .from("course")
    .insert({
      code: `LT-RACE-${Date.now()}`,
      title: "Load Test Scheduler Race Course",
      lecture_unit: 3,
      laboratory_unit: 0,
    })
    .select("id")
    .single();
  if (courseError) throw courseError;

  // Same class shape createSessionFromOffering() produces for a fresh
  // offering (a TMP-<uuid> code that the app later replaces).
  const { data: raceClass, error: classError } = await admin
    .from("class")
    .insert({ code: `TMP-LOADTEST-RACE` })
    .select("id")
    .single();
  if (classError) throw classError;

  const { data: utilization, error: utilizationError } = await admin
    .from("course_utilization")
    .insert({
      class_id: raceClass.id,
      course_id: course.id,
      section_id: scope.sectionId,
    })
    .select("id")
    .single();
  if (utilizationError) throw utilizationError;

  const { error: userClassError } = await admin
    .from("user_class")
    .insert({ user_id: personas.chair.userId, class_id: raceClass.id });
  if (userClassError) throw userClassError;

  const { data: room, error: roomError } = await admin
    .from("room")
    .select("id")
    .eq("campus_id", scope.campusId)
    .limit(1)
    .maybeSingle();
  if (roomError) throw roomError;
  if (!room) {
    throw new Error(
      `No room found for the scope campus (${scope.campusId}). Check supabase/seeds.`,
    );
  }

  writeState("schedule-race.json", {
    classId: raceClass.id,
    courseId: course.id,
    courseUtilizationId: utilization.id,
    roomId: room.id,
    facultyUserId: personas.chair.userId,
    sectionId: scope.sectionId,
    academicTermId: scope.academicTermId,
    day: RACE_DAY,
    startTime: RACE_START_TIME,
    endTime: RACE_END_TIME,
  });

  const nextScope: ScheduleRaceScope = {
    ...scope,
    raceClassIds: [raceClass.id],
    raceCourseIds: [course.id],
    raceCourseUtilizationIds: [utilization.id],
  };
  saveScope(nextScope);

  console.log(
    `Seeded schedule-race target: class ${raceClass.id} (section ${scope.sectionId}), ` +
      `room ${room.id}, ${RACE_DAY} ${RACE_START_TIME}-${RACE_END_TIME}. ` +
      "Wrote .state/schedule-race.json.",
  );
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
