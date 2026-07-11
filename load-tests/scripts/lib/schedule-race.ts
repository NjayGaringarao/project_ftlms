import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeedScope } from "./scope";

// Shared cleanup for the scheduler write-race scenario's synthetic rows
// (course, class, course_utilization, user_class, sessions) — used by both
// seed-schedule-race.ts (fresh slate before reseeding, so stale sessions
// from a previous run don't make every VU's conflict check trip) and
// reset-test-data.ts.

export type ScheduleRaceScope = SeedScope & {
  raceClassIds?: string[];
  raceCourseIds?: string[];
  raceCourseUtilizationIds?: string[];
};

export const cleanupScheduleRace = async (
  admin: SupabaseClient,
  scope: ScheduleRaceScope,
): Promise<ScheduleRaceScope> => {
  const classIds = scope.raceClassIds ?? [];
  const courseIds = scope.raceCourseIds ?? [];
  const utilizationIds = scope.raceCourseUtilizationIds ?? [];

  if (classIds.length > 0) {
    // Deleting session rows cascades to session_class; user_class and
    // session_class also cascade off class, but sessions themselves only
    // reference room, so they must be collected via session_class first.
    const { data: links, error: linkError } = await admin
      .from("session_class")
      .select("session_id")
      .in("class_id", classIds);
    if (linkError) throw linkError;
    const sessionIds = Array.from(
      new Set((links ?? []).map((row) => row.session_id as string).filter(Boolean)),
    );
    if (sessionIds.length > 0) {
      const { error, count } = await admin
        .from("session")
        .delete({ count: "exact" })
        .in("id", sessionIds);
      if (error) throw error;
      console.log(`Deleted ${count ?? 0} race session row(s).`);
    }

    const { error: userClassError } = await admin
      .from("user_class")
      .delete()
      .in("class_id", classIds);
    if (userClassError) throw userClassError;
  }

  if (utilizationIds.length > 0) {
    const { error } = await admin
      .from("course_utilization")
      .delete()
      .in("id", utilizationIds);
    if (error) throw error;
  }

  if (classIds.length > 0) {
    const { error, count } = await admin
      .from("class")
      .delete({ count: "exact" })
      .in("id", classIds);
    if (error) throw error;
    console.log(`Deleted ${count ?? 0} race class row(s).`);
  }

  if (courseIds.length > 0) {
    const { error } = await admin.from("course").delete().in("id", courseIds);
    if (error) throw error;
  }

  return {
    ...scope,
    raceClassIds: [],
    raceCourseIds: [],
    raceCourseUtilizationIds: [],
  };
};
