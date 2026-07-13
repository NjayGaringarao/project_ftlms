import { loadEnv } from "./lib/env";
import { createSupabaseAdmin } from "./lib/supabase-admin";
import { loadScopeOrThrow } from "./lib/scope";
import { readState, writeState } from "./lib/state";
import { cleanupScheduleRace, type ScheduleRaceScope } from "./lib/schedule-race";

type PersonaSeedResult = { userId: string; designationId: string; email: string };
type Personas = Record<"chair" | "campusDirector" | "dfi" | "vpaa", PersonaSeedResult>;

type PoolIds = {
  raceClassIds: string[];
  raceCourseIds: string[];
  raceCourseUtilizationIds: string[];
};

// Seeds a POOL of isolated race targets for k6/scheduler-sessions.rest.ramp.js
// — same synthetic-course/class pattern as seed-schedule-race.ts, but N of
// them (LOAD_TEST_SCHEDULE_RACE_POOL_SIZE, default 8). Ramping VUs round-robin
// through the pool per iteration (see the k6 script) — a pool much smaller
// than the VU count is what produces real multi-VU contention on the *same*
// target as concurrency climbs; a 1:1 VU:target ratio would just be N
// independent single-writer inserts, not a race.
//
// Every pool entry gets its OWN non-overlapping time slot — NOT just a
// different room at a shared time. All entries use the same synthetic
// faculty (the chair persona, matching seed-schedule-race.ts), and the app's
// conflict check also checks the faculty's own schedule, not just the room —
// so entries sharing a time slot would make the *first* win correctly reject
// every other entry as a faculty double-booking, collapsing the whole pool
// down to one usable target after the first insert. Rooms are still cycled
// for variety, but time is what actually keeps entries independent.
//
// Tracked separately from seed-schedule-race.ts's single target (its own
// .state/schedule-race-pool-scope.json, not merged into seed-scope.json) so
// reseeding the pool never orphans or deletes the single-target race test's
// row, and vice versa.
const RACE_DAY = "Friday";
const SLOT_START_MINUTES = 19 * 60; // 19:00 — clear of seeded daytime sessions
const SLOT_LENGTH_MINUTES = 20;
const SLOT_GAP_MINUTES = 10;
const LAST_ALLOWED_MINUTE = 23 * 60 + 30; // keep every slot within the same day

const toTime = (minutes: number): string => {
  const hour = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const minute = (minutes % 60).toString().padStart(2, "0");
  return `${hour}:${minute}:00`;
};

const main = async () => {
  loadEnv();
  const admin = createSupabaseAdmin();
  const scope = loadScopeOrThrow() as ScheduleRaceScope;
  const personas = readState<Personas>("personas.json");
  if (!personas) {
    throw new Error("No .state/personas.json found. Run `npm run seed` first.");
  }

  const previousPool = readState<PoolIds>("schedule-race-pool-scope.json");
  if (previousPool) {
    await cleanupScheduleRace(admin, { ...scope, ...previousPool });
  }

  const { data: rooms, error: roomError } = await admin
    .from("room")
    .select("id")
    .eq("campus_id", scope.campusId);
  if (roomError) throw roomError;
  if (!rooms || rooms.length === 0) {
    throw new Error(`No rooms found for the scope campus (${scope.campusId}). Check supabase/seeds.`);
  }

  const poolSize = Number(process.env.LOAD_TEST_SCHEDULE_RACE_POOL_SIZE || 8);
  // One unique time slot per entry (see comment above for why) — not grouped
  // by room.
  const lastSlotStart = SLOT_START_MINUTES + (poolSize - 1) * (SLOT_LENGTH_MINUTES + SLOT_GAP_MINUTES);
  if (lastSlotStart + SLOT_LENGTH_MINUTES > LAST_ALLOWED_MINUTE) {
    throw new Error(
      `LOAD_TEST_SCHEDULE_RACE_POOL_SIZE=${poolSize} needs ${poolSize} unique time slots, which ` +
        "doesn't fit in one evening (19:00-23:30) at the current slot length. Lower the pool size.",
    );
  }

  const pool: Record<string, unknown>[] = [];
  const raceClassIds: string[] = [];
  const raceCourseIds: string[] = [];
  const raceCourseUtilizationIds: string[] = [];

  for (let i = 0; i < poolSize; i += 1) {
    const room = rooms[i % rooms.length];
    const startMinutes = SLOT_START_MINUTES + i * (SLOT_LENGTH_MINUTES + SLOT_GAP_MINUTES);
    const endMinutes = startMinutes + SLOT_LENGTH_MINUTES;

    const { data: course, error: courseError } = await admin
      .from("course")
      .insert({
        code: `LT-RACEPOOL-${Date.now()}-${i}`,
        title: `Load Test Scheduler Race Pool Course ${i}`,
        lecture_unit: 3,
        laboratory_unit: 0,
      })
      .select("id")
      .single();
    if (courseError) throw courseError;

    const { data: raceClass, error: classError } = await admin
      .from("class")
      .insert({ code: `TMP-LOADTEST-RACEPOOL-${i}` })
      .select("id")
      .single();
    if (classError) throw classError;

    const { data: utilization, error: utilizationError } = await admin
      .from("course_utilization")
      .insert({ class_id: raceClass.id, course_id: course.id, section_id: scope.sectionId })
      .select("id")
      .single();
    if (utilizationError) throw utilizationError;

    const { error: userClassError } = await admin
      .from("user_class")
      .insert({ user_id: personas.chair.userId, class_id: raceClass.id });
    if (userClassError) throw userClassError;

    pool.push({
      classId: raceClass.id,
      courseId: course.id,
      courseUtilizationId: utilization.id,
      roomId: room.id,
      facultyUserId: personas.chair.userId,
      sectionId: scope.sectionId,
      academicTermId: scope.academicTermId,
      day: RACE_DAY,
      startTime: toTime(startMinutes),
      endTime: toTime(endMinutes),
    });
    raceClassIds.push(raceClass.id);
    raceCourseIds.push(course.id);
    raceCourseUtilizationIds.push(utilization.id);
  }

  writeState("schedule-race-pool.json", pool);
  writeState("schedule-race-pool-scope.json", {
    raceClassIds,
    raceCourseIds,
    raceCourseUtilizationIds,
  } satisfies PoolIds);

  console.log(
    `Seeded ${pool.length} schedule-race pool target(s), each its own time slot, across ` +
      `${rooms.length} room(s). Wrote .state/schedule-race-pool.json.`,
  );
};

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
