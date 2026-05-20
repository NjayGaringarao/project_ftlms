"use server";

import { createClient } from "@/utils/supabase/server";
import { first, normalizeDay, normalizeType, toMinutes } from "./utils";
import type {
  RawClassDetailsRow,
  RawRoomRow,
  RawSessionRow,
  SchedulerDialogSection,
  SchedulerDialogDetails,
  SchedulerDialogRoom,
  SchedulerDialogSession,
  SessionRoomOption,
  SessionSummary,
} from "./types";
import { formatMergedSectionLabels } from "@/features/course-loading/lib/formatters";

export const getSessionSummaries = async (
  sessionIds: string[],
): Promise<SessionSummary[]> => {
  if (!sessionIds || sessionIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_class")
    .select(
      `
      session:session_id(id, day, start_time, end_time, type, room_id, room:room_id(code, name)),
      class:class_id(
        id,
        code,
        user_class(user:user_id(id, identity:identity(name))),
        course_utilization(
          course:course_id(code, title),
          section:section_id(
            code,
            classification,
            major_offering:major_offering_id(
              program_offering:program_offering_id(
                campus_id,
                program:program_id(college_id)
              )
            )
          )
        )
      )
      `,
    )
    .in("session_id", sessionIds);

  if (error) {
    console.error("lib.schedule.session-actions.getSessionSummaries ::", error);
    return [];
  }

  return (data ?? []).map((item) => {
    const session = first((item as { session?: unknown }).session) as {
      id?: string;
      day?: string;
      start_time?: string;
      end_time?: string;
      type?: string;
      room_id?: string | null;
      room?: unknown;
    } | null;
    const classRow = first((item as { class?: unknown }).class) as {
      id?: string;
      code?: string;
      user_class?: unknown;
      course_utilization?: unknown;
    } | null;
    const userClass = first(
      (classRow?.user_class ?? []) as Array<{ user?: unknown }>,
    ) as { user?: unknown } | null;
    const user = first(userClass?.user) as {
      id?: string;
      identity?: unknown;
    } | null;
    const identity = first(user?.identity) as { name?: string } | null;
    const room = first(session?.room as unknown) as {
      code?: string | null;
      name?: string | null;
    } | null;
    const utilization = first(
      (classRow?.course_utilization ?? []) as Array<{
        course?: unknown;
        section?: unknown;
      }>,
    ) as { course?: unknown; section?: unknown } | null;
    const course = first(utilization?.course) as {
      code?: string;
      title?: string;
    } | null;
    const sections = (classRow?.course_utilization ?? []) as Array<{
      section?: unknown;
    }>;
    const sectionRows = sections
      .map((entry) =>
        first(entry.section) as {
          code?: string;
          classification?: "regular" | "irregular";
        } | null,
      )
      .filter((section): section is {
        code?: string;
        classification?: "regular" | "irregular";
      } => Boolean(section?.code));
    const sectionCodes = Array.from(
      new Set(sectionRows.map((section) => section.code ?? "").filter(Boolean)),
    );
    const sectionLabel = formatMergedSectionLabels(
      sectionRows,
      (section) => section.code ?? "Unknown",
    );
    const section = first(utilization?.section) as {
      major_offering?: unknown;
    } | null;
    const majorOffering = first(section?.major_offering) as {
      program_offering?: unknown;
    } | null;
    const programOffering = first(majorOffering?.program_offering) as {
      campus_id?: string;
      program?: unknown;
    } | null;
    const program = first(programOffering?.program) as { college_id?: string } | null;

    return {
      session_id: session?.id ?? "",
      class_id: classRow?.id ?? "",
      class_code: classRow?.code ?? "",
      course_code: course?.code ?? null,
      course_title: course?.title ?? null,
      faculty_id: user?.id ?? null,
      faculty_name: identity?.name ?? null,
      room_id: session?.room_id ?? null,
      room_code: room?.code ?? null,
      room_name: room?.name ?? null,
      campus_id: programOffering?.campus_id ?? null,
      college_id: program?.college_id ?? null,
      day: normalizeDay((session?.day as SessionSummary["day"]) ?? "Monday"),
      start_time: session?.start_time ?? "00:00:00",
      end_time: session?.end_time ?? "00:00:00",
      type: normalizeType((session?.type as SessionSummary["type"]) ?? "Lecture"),
      section_codes: sectionCodes,
      section_label: sectionLabel,
    };
  });
};

export const getSessionSummariesByClass = async (
  classId: string,
): Promise<SessionSummary[]> => {
  if (!classId?.trim()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_class")
    .select(
      `
      session:session_id(id, day, start_time, end_time, type, room_id, room:room_id(code, name)),
      class:class_id(
        id,
        code,
        user_class(user:user_id(id, identity:identity(name))),
        course_utilization(
          course:course_id(code, title),
          section:section_id(
            code,
            major_offering:major_offering_id(
              program_offering:program_offering_id(
                campus_id,
                program:program_id(college_id)
              )
            )
          )
        )
      )
      `,
    )
    .eq("class_id", classId);

  if (error) {
    console.error(
      "lib.schedule.session-actions.getSessionSummariesByClass ::",
      error,
    );
    return [];
  }

  const sessionIds = (data ?? [])
    .map((item) => {
      const session = first((item as { session?: unknown }).session) as {
        id?: string;
      } | null;
      return session?.id ?? "";
    })
    .filter(Boolean);

  return getSessionSummaries(sessionIds);
};

export const getRoomsForClass = async (
  classId: string,
): Promise<SessionRoomOption[]> => {
  if (!classId?.trim()) return [];
  const supabase = await createClient();

  const { data: classData, error: classError } = await supabase
    .from("class")
    .select(
      `
      course_utilization(
        section:section_id(
          major_offering:major_offering_id(
            program_offering:program_offering_id(campus_id)
          )
        )
      )
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classData) {
    if (classError) {
      console.error("lib.schedule.session-actions.getRoomsForClass ::", classError);
    }
    return [];
  }

  const utilizations = (classData as { course_utilization?: unknown })
    .course_utilization as Array<{ section?: unknown }> | null;
  const campusIds = Array.from(
    new Set(
      (utilizations ?? [])
        .map((item) => first(item.section) as { major_offering?: unknown } | null)
        .map((section) => {
          const majorOffering = first(section?.major_offering as unknown) as {
            program_offering?: unknown;
          } | null;
          return first(majorOffering?.program_offering as unknown) as {
            campus_id?: string | null;
          } | null;
        })
        .map((offering) => offering?.campus_id ?? null)
        .filter((item): item is string => Boolean(item)),
    ),
  );

  const roomsResult = campusIds.length
    ? await supabase
        .from("room")
        .select("id, code, name, capacity, campus_id, campus:campus_id(id, code, name)")
        .in("campus_id", campusIds)
        .order("code", { ascending: true })
    : await supabase
        .from("room")
        .select("id, code, name, capacity, campus_id, campus:campus_id(id, code, name)")
        .order("code", { ascending: true });

  if (roomsResult.error) {
    console.error(
      "lib.schedule.session-actions.getRoomsForClass.rooms ::",
      roomsResult.error,
    );
    return [];
  }

  return (roomsResult.data ?? []).map((item) => {
    const room = item as RawRoomRow;
    const campus = first(room.campus);
    return {
      id: room.id,
      code: room.code,
      name: room.name ?? "Unnamed Room",
      capacity: room.capacity ?? null,
      campus_id: room.campus_id ?? null,
      campus_code: campus?.code ?? null,
      campus_name: campus?.name ?? null,
    };
  });
};

export const getClassSchedulerDetails = async (
  classId: string,
): Promise<{ data?: SchedulerDialogDetails; error?: string }> => {
  if (!classId?.trim()) return { error: "Class is required" };

  const supabase = await createClient();
  const { data: classData, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      user_class(
        user:user_id(
          id,
          identity:identity(name),
          rank:academic_rank_id(code, title),
          degree(title, academic_level, year_graduated)
        )
      ),
      course_utilization(
        course:course_id(id, code, title, lecture_unit, laboratory_unit),
        section:section_id(
          id,
          code,
          year_level,
  name,
          student_count,
          academic_term_id,
          major_offering:major_offering_id(
            major:major_id(code, name),
            program_offering:program_offering_id(
              program:program_id(code, name),
              campus:campus_id(id, name, address)
            )
          )
        )
      )
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classData) {
    return { error: classError?.message ?? "Class not found" };
  }

  const classRow = classData as RawClassDetailsRow;
  const userClass = first(classRow.user_class) as { user?: unknown } | null;
  const facultyRow = first(userClass?.user) as {
    id?: string;
    identity?: unknown;
    rank?: unknown;
    degree?: Array<{ title?: string | null }> | null;
  } | null;

  const facultyIdentity = first(facultyRow?.identity) as { name?: string } | null;
  const facultyRank = first(facultyRow?.rank) as { title?: string } | null;
  const facultyDegrees = (facultyRow?.degree ?? [])
    .map((item) => item.title)
    .filter((item): item is string => Boolean(item));

  const utilizations = classRow.course_utilization ?? [];
  const firstUtil = utilizations[0];
  const course = first(firstUtil?.course) as {
    code?: string | null;
    title?: string | null;
    lecture_unit?: number | null;
    laboratory_unit?: number | null;
  } | null;

  const sections: SchedulerDialogSection[] = utilizations.map((util) => {
    const section = first(util.section);
    const majorOffering = first(section?.major_offering);
    const major = first(majorOffering?.major);
    const programOffering = first(majorOffering?.program_offering);
    const program = first(programOffering?.program);
    const campus = first(programOffering?.campus);

    return {
      id: section?.id ?? "",
      code: section?.code ?? "Unknown",
      year_level: section?.year_level ?? null,
      name: section?.name ?? null,
      student_count: section?.student_count ?? null,
      program_name: program?.name ?? null,
      major_name: major?.name ?? null,
      campus_id: campus?.id ?? null,
      campus_name: campus?.name ?? null,
      campus_address: campus?.address ?? null,
    };
  });

  const campusIds = Array.from(
    new Set(
      sections
        .map((item) => item.campus_id)
        .filter((item): item is string => Boolean(item)),
    ),
  );

  const roomsResult = campusIds.length
    ? await supabase
        .from("room")
        .select("id, code, name, capacity, campus_id, campus:campus_id(id, name)")
        .in("campus_id", campusIds)
        .order("code", { ascending: true })
    : await supabase
        .from("room")
        .select("id, code, name, capacity, campus_id, campus:campus_id(id, name)")
        .order("code", { ascending: true });

  if (roomsResult.error) {
    return { error: roomsResult.error.message };
  }

  const { data: sessionsResult, error: sessionsError } = await supabase
    .from("session_class")
    .select(
      "session:session_id(id, code, day, start_time, end_time, type, room:room_id(id, code, name))",
    )
    .eq("class_id", classId)
    .order("session.day", { ascending: true })
    .order("session.start_time", { ascending: true });

  if (sessionsError) {
    return { error: sessionsError.message };
  }

  const sessions: SchedulerDialogSession[] = (sessionsResult ?? []).map((item) => {
    const row = first((item as { session?: unknown }).session) as RawSessionRow | null;
    const room = first(row?.room);
    return {
      id: row?.id ?? "",
      code: row?.code ?? "",
      day: normalizeDay(row?.day),
      start_time: row?.start_time ?? "00:00:00",
      end_time: row?.end_time ?? "00:00:00",
      type: normalizeType(row?.type),
      room_id: room?.id ?? null,
      room_code: room?.code ?? null,
      room_name: room?.name ?? null,
    };
  });

  const lectureUnit = Number(course?.lecture_unit ?? 0);
  const laboratoryUnit = Number(course?.laboratory_unit ?? 0);
  const lectureTarget = lectureUnit;
  const laboratoryTarget = laboratoryUnit * 3;

  const lectureScheduled = sessions
    .filter((item) => item.type === "Lecture")
    .reduce(
      (sum, item) => sum + (toMinutes(item.end_time) - toMinutes(item.start_time)) / 60,
      0,
    );

  const laboratoryScheduled = sessions
    .filter((item) => item.type === "Laboratory")
    .reduce(
      (sum, item) => sum + (toMinutes(item.end_time) - toMinutes(item.start_time)) / 60,
      0,
    );

  const rooms: SchedulerDialogRoom[] = (roomsResult.data ?? []).map((item) => {
    const room = item as RawRoomRow;
    const campus = first(room.campus);
    return {
      id: room.id,
      code: room.code,
      name: room.name ?? "Unnamed Room",
      capacity: room.capacity ?? null,
      campus_id: room.campus_id ?? "",
      campus_name: campus?.name ?? null,
    };
  });

  const academicTermId = first(firstUtil?.section)?.academic_term_id ?? "";

  return {
    data: {
      class_id: classRow.id,
      class_code: classRow.code ?? "Unknown",
      academic_term_id: academicTermId,
      faculty_id: facultyRow?.id ?? "",
      faculty_name: facultyIdentity?.name ?? "Unknown Faculty",
      faculty_rank: facultyRank?.title ?? null,
      faculty_degrees: facultyDegrees,
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      lecture_unit: lectureUnit,
      laboratory_unit: laboratoryUnit,
      total_hours: lectureTarget + laboratoryTarget,
      unscheduled_lecture_hours: Math.max(lectureTarget - lectureScheduled, 0),
      unscheduled_laboratory_hours: Math.max(
        laboratoryTarget - laboratoryScheduled,
        0,
      ),
      sections,
      rooms,
      sessions,
    },
  };
};
