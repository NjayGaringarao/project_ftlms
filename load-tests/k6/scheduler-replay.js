import http from "k6/http";
import { check } from "k6";
import {
  BASE_URL,
  SUPABASE_URL,
  applyCookies,
  postgrestHeaders,
  postgrestUrl,
} from "./config.js";

// Replays every request a real "/scheduler with a section selected" page-open
// causes. The page's Server Component only fetches terms; the actual data
// loading happens after hydration, when schedule-mapper.tsx's useEffect calls
// "use server" actions that each hit Supabase. Those server-action wire
// payloads are build-specific and not safely replayable, so we reproduce the
// PostgREST queries the actions themselves issue (same tables, filters, and
// user JWT — identical DB work). Each query below names the app function it
// mirrors; if that function's select changes, update the constant here.

// Mirrors getClassIdsBySection() — web-app/src/features/scheduler/lib/schedule/mapper.ts
const CLASS_IDS_BY_SECTION_SELECT = "class_id,section:section_id(academic_term_id)";

// Mirrors getSchedulerMapperMatrixByOnlineSection() — mapper.ts
const ONLINE_SESSIONS_SELECT =
  "class_id,class:class_id(code),session:session_id(id,day,start_time,end_time,room_id)";

// Mirrors getSectionCourseOfferingsForScheduler() —
// web-app/src/features/scheduler/lib/schedule/course-offerings.ts
const COURSE_OFFERINGS_SELECT =
  "id,course_id,class_id,section_id," +
  "course:course_id(id,code,title,lecture_unit,laboratory_unit)," +
  "section:section_id(id,code,classification,student_count,academic_term_id," +
  "major_offering:major_offering_id(program_offering:program_offering_id(campus_id)))," +
  "class:class_id(id,code," +
  "user_class(user:user_id(id,identity:identity(first_name,middle_name,last_name,suffix,professional_extension)))," +
  "course_utilization(section:section_id(id,code,classification))," +
  "session_class(session:session_id(type,start_time,end_time)))";

const parseJsonArray = (res) => {
  try {
    const parsed = JSON.parse(res.body);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const runSchedulerPageOpen = ({ scope, session, extraTags = {} }) => {
  const jar = http.cookieJar();
  applyCookies(jar, BASE_URL, session.cookies);
  const tagged = (endpoint) => ({ endpoint, ...extraTags });
  const headers = postgrestHeaders(session.accessToken);

  // 1. SSR shell — middleware auth + Server Component render (terms queries).
  const pageRes = http.get(
    `${BASE_URL}/scheduler?academic_term_id=${scope.academicTermId}` +
      `&sectionId=${scope.sectionId}`,
    { jar, tags: tagged("page") },
  );
  check(pageRes, {
    "scheduler page 200": (r) => r.status === 200,
    "not redirected to login": (r) => !r.url.includes("/auth/login"),
  });

  // 2. The heavy read — mirrors getSchedulerMapperMatrices() calling the
  //    get_scheduler_matrices() RPC (mapper.ts).
  const rpcRes = http.post(
    `${SUPABASE_URL}/rest/v1/rpc/get_scheduler_matrices`,
    JSON.stringify({
      academic_term_id: scope.academicTermId,
      section_id: scope.sectionId,
      faculty_id: null,
      room_id: null,
    }),
    { headers, tags: tagged("rpc_matrices") },
  );
  check(rpcRes, {
    "matrices rpc 200": (r) => r.status === 200,
    "matrices rpc has section matrix": (r) => {
      try {
        const payload = JSON.parse(r.body);
        return payload && Array.isArray(payload.section);
      } catch {
        return false;
      }
    },
  });

  // 3. Online (room-less) sessions for the section — mirrors
  //    getSchedulerMapperMatrixByOnlineSection(): first getClassIdsBySection(),
  //    then the session_class select filtered to room_id is null.
  const classIdsRes = http.get(
    postgrestUrl("course_utilization", {
      select: CLASS_IDS_BY_SECTION_SELECT,
      section_id: `eq.${scope.sectionId}`,
      "section.academic_term_id": `eq.${scope.academicTermId}`,
    }),
    { headers, tags: tagged("online_sessions") },
  );
  check(classIdsRes, { "class ids by section 200": (r) => r.status === 200 });

  const classIds = Array.from(
    new Set(
      (parseJsonArray(classIdsRes) ?? [])
        .map((row) => row.class_id)
        .filter(Boolean),
    ),
  );

  if (classIds.length > 0) {
    const onlineRes = http.get(
      postgrestUrl("session_class", {
        select: ONLINE_SESSIONS_SELECT,
        class_id: `in.(${classIds.join(",")})`,
        "session.room_id": "is.null",
      }),
      { headers, tags: tagged("online_sessions") },
    );
    check(onlineRes, { "online sessions 200": (r) => r.status === 200 });
  }

  // 4. Course offerings for the right pane — mirrors
  //    getSectionCourseOfferingsForScheduler() (course-offerings.ts).
  const offeringsRes = http.get(
    postgrestUrl("course_utilization", {
      select: COURSE_OFFERINGS_SELECT,
      section_id: `eq.${scope.sectionId}`,
      order: "id.asc",
    }),
    { headers, tags: tagged("course_offerings") },
  );
  // Empty is a legitimate result here — the local seeds ship no
  // course_utilization rows — so only the response shape is asserted.
  check(offeringsRes, {
    "course offerings 200": (r) => r.status === 200,
    "course offerings is array": (r) => parseJsonArray(r) !== null,
  });
};
