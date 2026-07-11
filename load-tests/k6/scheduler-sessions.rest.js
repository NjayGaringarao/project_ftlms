import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import {
  SUPABASE_URL,
  loadJson,
  postgrestHeaders,
  postgrestUrl,
  VUS,
} from "./config.js";

// Scheduler WRITE-path race: every VU simultaneously replays the app's
// createClassSession() flow (web-app/src/features/scheduler/lib/schedule/
// session-actions/mutations.ts) for the SAME class/room/day/time window:
//
//   1. read conflict windows (getSessionConflictWindows / shared.ts queries)
//   2. check overlaps in JS (ported from session-actions/utils.ts)
//   3. if clear: insert `session`, then insert `session_class`
//
// That check-then-insert sequence is exactly what the server action does, and
// there is NO database-level guard behind it (no exclusion constraint on
// session overlap) — so under concurrency, several VUs can all see "no
// conflict" and all insert, double-booking the room/faculty/section slot.
//
// This scenario MEASURES that race window; it does not fail on it. If the
// conflict check were airtight, `session_insert_wins` would be exactly 1 and
// teardown would find 1 overlapping session. A count > 1 is the expected,
// documented outcome — the fix, if the app ever wants one, is a DB exclusion
// constraint (e.g. EXCLUDE USING gist on room/day/timerange), not a change
// to this test.

const race = loadJson("../.state/schedule-race.json");
const session = loadJson("../.state/session.chair.json");

const raceIterations = Math.min(VUS, 20);

const sessionInsertWins = new Counter("session_insert_wins");
const sessionConflictSkips = new Counter("session_conflict_skips");

export const options = {
  scenarios: {
    session_create_race: {
      executor: "shared-iterations",
      vus: raceIterations,
      iterations: raceIterations,
      maxDuration: "30s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

// PostgREST returns to-one embeds as objects; supabase-js sometimes as
// one-element arrays. Tolerate both (same as the app's first() helper).
const first = (value) => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

// Ported from session-actions/utils.ts so the in-JS conflict decision matches
// the app's exactly.
const toMinutes = (value) => {
  if (!value) return 0;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
};
const overlaps = (startA, endA, startB, endB) =>
  toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);

const parseArray = (res) => {
  try {
    const parsed = JSON.parse(res.body);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Mirrors getSessionWindowsByPredicate()'s session_class select (shared.ts).
const WINDOWS_SELECT =
  "session:session_id(start_time,end_time,day,room_id)," +
  "class:class_id(id,user_class(user_id),course_utilization(section_id,section:section_id(academic_term_id)))";

const extractWindows = (res) =>
  parseArray(res)
    .map((row) => first(row.session))
    .filter((s) => s && s.start_time && s.end_time)
    .map((s) => ({ start_time: s.start_time, end_time: s.end_time }));

export default function () {
  const headers = postgrestHeaders(session.accessToken);
  const get = (url) => http.get(url, { headers });

  // 1. Class context — mirrors getClassContext() (shared.ts).
  const contextRes = get(
    postgrestUrl("class", {
      select:
        "id,user_class(user_id),course_utilization(section_id,section:section_id(academic_term_id))",
      id: `eq.${race.classId}`,
    }),
  );
  check(contextRes, { "class context 200": (r) => r.status === 200 });

  // 2. Conflict windows — mirrors getSessionConflictWindows() (conflicts.ts):
  //    own sessions + faculty + section + room windows for the target day.
  const ownRes = get(
    postgrestUrl("session_class", {
      select: "session:session_id(start_time,end_time)",
      class_id: `eq.${race.classId}`,
      "session.day": `eq.${race.day}`,
    }),
  );

  const facultyClassesRes = get(
    postgrestUrl("user_class", {
      select: "class_id",
      user_id: `eq.${race.facultyUserId}`,
    }),
  );
  const facultyClassIds = parseArray(facultyClassesRes)
    .map((row) => row.class_id)
    .filter(Boolean);
  const facultyWindowsRes =
    facultyClassIds.length > 0
      ? get(
          postgrestUrl("session_class", {
            select: WINDOWS_SELECT,
            "session.day": `eq.${race.day}`,
            "class.course_utilization.section.academic_term_id": `eq.${race.academicTermId}`,
            class_id: `in.(${facultyClassIds.join(",")})`,
            "class.id": `neq.${race.classId}`,
          }),
        )
      : null;

  const sectionClassesRes = get(
    postgrestUrl("course_utilization", {
      select: "class_id,section:section_id(academic_term_id)",
      section_id: `in.(${race.sectionId})`,
      "section.academic_term_id": `eq.${race.academicTermId}`,
    }),
  );
  const sectionClassIds = Array.from(
    new Set(parseArray(sectionClassesRes).map((row) => row.class_id).filter(Boolean)),
  );
  const sectionWindowsRes =
    sectionClassIds.length > 0
      ? get(
          postgrestUrl("session_class", {
            select: WINDOWS_SELECT,
            "session.day": `eq.${race.day}`,
            "class.course_utilization.section.academic_term_id": `eq.${race.academicTermId}`,
            class_id: `in.(${sectionClassIds.join(",")})`,
            "class.id": `neq.${race.classId}`,
          }),
        )
      : null;

  const roomWindowsRes = get(
    postgrestUrl("session_class", {
      select: WINDOWS_SELECT,
      "session.day": `eq.${race.day}`,
      "session.room_id": `eq.${race.roomId}`,
      "class.course_utilization.section.academic_term_id": `eq.${race.academicTermId}`,
      "class.id": `neq.${race.classId}`,
    }),
  );

  const windows = [
    ...extractWindows(ownRes),
    ...(facultyWindowsRes ? extractWindows(facultyWindowsRes) : []),
    ...(sectionWindowsRes ? extractWindows(sectionWindowsRes) : []),
    ...extractWindows(roomWindowsRes),
  ];

  const conflict = windows.find((window) =>
    overlaps(race.startTime, race.endTime, window.start_time, window.end_time),
  );

  if (conflict) {
    // The app would surface "<reason> at <window>" to the user and insert
    // nothing — a VU landing here lost the race *after* someone else's insert
    // became visible, which is the check working as designed.
    sessionConflictSkips.add(1);
    check(conflict, { "conflict check skipped cleanly": () => true });
    return;
  }

  // 3. Same two inserts createClassSession() performs.
  const sessionRes = http.post(
    `${SUPABASE_URL}/rest/v1/session`,
    JSON.stringify({
      code: "",
      room_id: race.roomId,
      day: race.day,
      start_time: race.startTime,
      end_time: race.endTime,
      type: "Lecture",
    }),
    { headers: { ...headers, Prefer: "return=representation" } },
  );
  check(sessionRes, { "session insert 201": (r) => r.status === 201 });
  const insertedSession = first(parseArray(sessionRes));
  if (!insertedSession?.id) return;

  const linkRes = http.post(
    `${SUPABASE_URL}/rest/v1/session_class`,
    JSON.stringify({ class_id: race.classId, session_id: insertedSession.id }),
    { headers },
  );
  check(linkRes, { "session_class insert 201": (r) => r.status === 201 });
  if (linkRes.status === 201) sessionInsertWins.add(1);
}

export function teardown() {
  const headers = postgrestHeaders(session.accessToken);
  const res = http.get(
    postgrestUrl("session_class", {
      select: "session:session_id(id,day,start_time,end_time)",
      class_id: `eq.${race.classId}`,
      "session.day": `eq.${race.day}`,
    }),
    { headers },
  );
  const overlapping = parseArray(res)
    .map((row) => first(row.session))
    .filter(
      (s) =>
        s &&
        s.start_time &&
        s.end_time &&
        overlaps(race.startTime, race.endTime, s.start_time, s.end_time),
    );

  console.log(
    `[write-race] ${overlapping.length} session(s) now occupy ` +
      `${race.day} ${race.startTime}-${race.endTime} for the race class/room. ` +
      (overlapping.length > 1
        ? `${overlapping.length - 1} double-booking(s) — the app-side conflict check lost the race.`
        : "No double-booking this run (the race window wasn't hit)."),
  );
}
