"use server";

import { createClient } from "@/utils/supabase/server";
import { SessionDay } from "@/features/shared/types/models";

export type SchedulerMapperContext = {
  facultyId?: string | null;
  sectionId?: string | null;
  roomId?: string | null;
};

export type SchedulerMapperClassListItem = {
  id: string;
  class_code: string;
  total_hours: number;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
};

export type SchedulerMatrixSession = {
  id: string;
  class_id: string;
  class_code: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  visual_source?: "schedule" | "merged_conflict";
  visual_label?: string | null;
};

export type SchedulerMatricesResult = {
  section: SchedulerMatrixSession[];
  faculty: SchedulerMatrixSession[];
  room: SchedulerMatrixSession[];
  error?: string;
};

type RawClassCourseRow = {
  lecture_unit?: number | null;
  laboratory_unit?: number | null;
};

type RawClassRow = {
  id: string;
  code: string;
  course_utilization?: Array<{
    course?: RawClassCourseRow | RawClassCourseRow[] | null;
  }> | null;
  session_class?: Array<{
    session?: {
      type?: "Lecture" | "Laboratory" | null;
      start_time?: string | null;
      end_time?: string | null;
    } | Array<{
      type?: "Lecture" | "Laboratory" | null;
      start_time?: string | null;
      end_time?: string | null;
    }> | null;
  }> | null;
};

type RawMatrixSessionRow = {
  id?: string | null;
  day?: SessionDay | string | null;
  start_time?: string | null;
  end_time?: string | null;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toMinutes = (value: string | null | undefined): number => {
  if (!value) return 0;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return 0;
  }

  return hour * 60 + minute;
};

const toHours = (minutes: number): number => {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return minutes / 60;
};

const isNoContext = (context: SchedulerMapperContext): boolean => {
  return !context.facultyId && !context.sectionId && !context.roomId;
};

const normalizeSessionDay = (
  value: string | null | undefined,
): SessionDay | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "monday":
      return "Monday";
    case "tuesday":
      return "Tuesday";
    case "wednesday":
      return "Wednesday";
    case "thursday":
      return "Thursday";
    case "friday":
      return "Friday";
    case "saturday":
      return "Saturday";
    case "sunday":
      return "Sunday";
    default:
      return null;
  }
};

const getClassIdsForTerm = async (
  academicTermId: string,
  classIds: string[],
): Promise<string[]> => {
  if (classIds.length === 0) return [];
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_utilization")
    .select("class_id, section:section_id(academic_term_id)")
    .in("class_id", classIds)
    .eq("section.academic_term_id", academicTermId);

  if (error) {
    console.error("lib.schedule.mapper.getClassIdsForTerm ::", error);
    return [];
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.class_id as string)
        .filter(Boolean),
    ),
  );
};

const getClassIdsBySection = async (
  academicTermId: string,
  sectionId: string,
): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_utilization")
    .select("class_id, section:section_id(academic_term_id)")
    .eq("section_id", sectionId)
    .eq("section.academic_term_id", academicTermId);

  if (error) {
    console.error("lib.schedule.mapper.getClassIdsBySection ::", error);
    return [];
  }

  return Array.from(
    new Set(
      (data ?? [])
        .map((row) => row.class_id as string)
        .filter(Boolean),
    ),
  );
};

const getClassIdsByFaculty = async (
  academicTermId: string,
  facultyId: string,
): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_class")
    .select("class_id")
    .eq("user_id", facultyId);

  if (error) {
    console.error("lib.schedule.mapper.getClassIdsByFaculty ::", error);
    return [];
  }

  const classIds = (data ?? [])
    .map((row) => row.class_id as string)
    .filter(Boolean);

  return getClassIdsForTerm(academicTermId, classIds);
};

const getClassIdsByRoom = async (
  academicTermId: string,
  roomId: string,
): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_class")
    .select("class_id, session:session_id(room_id)")
    .eq("session.room_id", roomId);

  if (error) {
    console.error("lib.schedule.mapper.getClassIdsByRoom ::", error);
    return [];
  }

  const classIds = (data ?? [])
    .map((row) => row.class_id as string)
    .filter(Boolean);

  return getClassIdsForTerm(academicTermId, classIds);
};

export const getSchedulerMapperClassList = async (
  academicTermId: string,
  context: SchedulerMapperContext,
): Promise<SchedulerMapperClassListItem[]> => {
  if (!academicTermId?.trim() || isNoContext(context)) {
    return [];
  }

  const supabase = await createClient();
  let classIds: string[] = [];

  if (context.facultyId) {
    classIds = await getClassIdsByFaculty(academicTermId, context.facultyId);
  } else if (context.sectionId) {
    classIds = await getClassIdsBySection(academicTermId, context.sectionId);
  } else if (context.roomId) {
    classIds = await getClassIdsByRoom(academicTermId, context.roomId);
  }

  if (classIds.length === 0) return [];

  const { data, error } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      course_utilization (
        course:course_id(lecture_unit, laboratory_unit)
      ),
      session_class (
        session:session_id(type, start_time, end_time)
      )
      `,
    )
    .in("id", classIds)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.schedule.mapper.getSchedulerMapperClassList ::", error);
    return [];
  }

  return ((data ?? []) as RawClassRow[]).map((row) => {
    const firstUtil = (row.course_utilization ?? [])[0];
    const course = first(firstUtil?.course);
    const lectureTarget = Number(course?.lecture_unit ?? 0);
    const laboratoryTarget = Number(course?.laboratory_unit ?? 0) * 3;

    const sessions = (row.session_class ?? []).map((sc) => first(sc.session));
    const scheduledLectureHours = sessions
      .filter((session) => session?.type === "Lecture")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);

    const scheduledLaboratoryHours = sessions
      .filter((session) => session?.type === "Laboratory")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);

    const unscheduledLectureHours = Math.max(lectureTarget - scheduledLectureHours, 0);
    const unscheduledLaboratoryHours = Math.max(
      laboratoryTarget - scheduledLaboratoryHours,
      0,
    );

    return {
      id: row.id,
      class_code: row.code,
      total_hours: lectureTarget + laboratoryTarget,
      unscheduled_lecture_hours: unscheduledLectureHours,
      unscheduled_laboratory_hours: unscheduledLaboratoryHours,
    };
  });
};

const getSchedulerMapperClassListByFaculty = async (
  academicTermId: string,
  facultyId: string,
): Promise<SchedulerMapperClassListItem[]> => {
  return getSchedulerMapperClassList(academicTermId, { facultyId });
};

const getSchedulerMapperClassListBySection = async (
  academicTermId: string,
  sectionId: string,
): Promise<SchedulerMapperClassListItem[]> => {
  return getSchedulerMapperClassList(academicTermId, { sectionId });
};

const getSchedulerMapperClassListByRoom = async (
  academicTermId: string,
  roomId: string,
): Promise<SchedulerMapperClassListItem[]> => {
  return getSchedulerMapperClassList(academicTermId, { roomId });
};

const loadMatrixSessions = async (
  classIds: string[],
): Promise<SchedulerMatrixSession[]> => {
  if (classIds.length === 0) return [];

  const supabase = await createClient();
  const { data: sessionData, error: sessionError } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      class:class_id(code),
      session:session_id(id, day, start_time, end_time)
      `,
    )
    .in("class_id", classIds);

  if (sessionError) {
    console.error("lib.schedule.mapper.loadMatrixSessions ::", sessionError);
    return [];
  }

  return (sessionData ?? [])
    .map((row) => {
      const session = first(row.session) as RawMatrixSessionRow | null;
      const cls = first(row.class) as { code?: string } | null;
      const normalizedDay = normalizeSessionDay(session?.day ?? null);
      if (!session?.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_id: row.class_id,
        class_code: cls?.code ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getSchedulerMapperMatrixByFaculty = async (
  academicTermId: string,
  facultyId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !facultyId?.trim()) {
    return [];
  }

  const classIds = await getClassIdsByFaculty(academicTermId, facultyId);
  return loadMatrixSessions(classIds);
};

export const getSchedulerMapperMatrixBySection = async (
  academicTermId: string,
  sectionId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !sectionId?.trim()) {
    return [];
  }

  const classIds = await getClassIdsBySection(academicTermId, sectionId);
  return loadMatrixSessions(classIds);
};

export const getSchedulerMapperMatrixByRoom = async (
  academicTermId: string,
  roomId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !roomId?.trim()) {
    return [];
  }

  const supabase = await createClient();
  const { data: sessionData, error } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      class:class_id(code, course_utilization(section:section_id(academic_term_id))),
      session:session_id(id, day, start_time, end_time, room_id)
      `,
    )
    .eq("session.room_id", roomId)
    .eq("class.course_utilization.section.academic_term_id", academicTermId);

  if (error) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByRoom ::", error);
    return [];
  }

  return (sessionData ?? [])
    .map((row) => {
      const session = first(row.session) as RawMatrixSessionRow | null;
      const cls = first(row.class) as { code?: string } | null;
      const normalizedDay = normalizeSessionDay(session?.day ?? null);
      if (!session?.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_id: row.class_id,
        class_code: cls?.code ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getSchedulerMapperMatrixByOnlineSection = async (
  academicTermId: string,
  sectionId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !sectionId?.trim()) {
    return [];
  }

  const classIds = await getClassIdsBySection(academicTermId, sectionId);
  if (classIds.length === 0) return [];

  const supabase = await createClient();
  const { data: sessionData, error } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      class:class_id(code),
      session:session_id(id, day, start_time, end_time, room_id)
      `,
    )
    .in("class_id", classIds)
    .is("session.room_id", null);

  if (error) {
    console.error(
      "lib.schedule.mapper.getSchedulerMapperMatrixByOnlineSection ::",
      error,
    );
    return [];
  }

  return (sessionData ?? [])
    .map((row) => {
      const session = first(row.session) as RawMatrixSessionRow | null;
      const cls = first(row.class) as { code?: string } | null;
      const normalizedDay = normalizeSessionDay(session?.day ?? null);
      if (!session?.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_id: row.class_id,
        class_code: cls?.code ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getMergedSectionConflictSessions = async (
  academicTermId: string,
  classId: string | null | undefined,
  currentSectionId: string | null | undefined,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !classId?.trim()) return [];

  const supabase = await createClient();
  const { data: classSections, error: classSectionsError } = await supabase
    .from("course_utilization")
    .select("section_id")
    .eq("class_id", classId);

  if (classSectionsError) {
    console.error(
      "lib.schedule.mapper.getMergedSectionConflictSessions.classSections ::",
      classSectionsError,
    );
    return [];
  }

  const mergedSectionIds = Array.from(
    new Set(
      (classSections ?? [])
        .map((row) => row.section_id as string)
        .filter((id) => Boolean(id) && id !== currentSectionId),
    ),
  );

  if (mergedSectionIds.length === 0) return [];

  const { data: conflictClasses, error: conflictClassesError } = await supabase
    .from("course_utilization")
    .select("class_id, section:section_id(id, code, academic_term_id)")
    .in("section_id", mergedSectionIds)
    .eq("section.academic_term_id", academicTermId)
    .neq("class_id", classId);

  if (conflictClassesError) {
    console.error(
      "lib.schedule.mapper.getMergedSectionConflictSessions.conflictClasses ::",
      conflictClassesError,
    );
    return [];
  }

  const classToSection = new Map<string, string>();
  (conflictClasses ?? []).forEach((row) => {
    const section = first((row as { section?: unknown }).section) as
      | { code?: string | null }
      | null;
    const conflictClassId = row.class_id as string | null;
    if (conflictClassId && section?.code) {
      classToSection.set(conflictClassId, section.code);
    }
  });

  const conflictClassIds = Array.from(classToSection.keys());
  if (conflictClassIds.length === 0) return [];

  const { data, error } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      class:class_id(code),
      session:session_id(id, day, start_time, end_time)
      `,
    )
    .in("class_id", conflictClassIds);

  if (error) {
    console.error(
      "lib.schedule.mapper.getMergedSectionConflictSessions.sessions ::",
      error,
    );
    return [];
  }

  const sessions: SchedulerMatrixSession[] = [];

  (data ?? []).forEach((row) => {
    const session = first((row as { session?: unknown }).session) as
      | RawMatrixSessionRow
      | null;
    const cls = first((row as { class?: unknown }).class) as
      | { code?: string }
      | null;
    const normalizedDay = normalizeSessionDay(session?.day ?? null);
    if (!session?.id || !normalizedDay || !session.start_time || !session.end_time) {
      return;
    }
    const conflictClassId = row.class_id as string;
    const sectionCode = classToSection.get(conflictClassId);

    sessions.push({
      id: `merged-conflict-${session.id}`,
      class_id: conflictClassId,
      class_code: cls?.code ?? "Unknown",
      day: normalizedDay,
      start_time: session.start_time,
      end_time: session.end_time,
      visual_source: "merged_conflict",
      visual_label: sectionCode
        ? `Merged section occupied: ${sectionCode}`
        : "Merged section occupied",
    });
  });

  return sessions;
};

type RawRpcSession = {
  id?: string | null;
  class_id?: string | null;
  class_code?: string | null;
  day?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

const normalizeRpcSessions = (rows: unknown): SchedulerMatrixSession[] => {
  const list = Array.isArray(rows) ? rows : [];
  return list
    .map((row) => {
      const session = row as RawRpcSession;
      const normalizedDay = normalizeSessionDay(session.day ?? null);
      if (
        !session.id ||
        !session.class_id ||
        !normalizedDay ||
        !session.start_time ||
        !session.end_time
      ) {
        return null;
      }

      return {
        id: session.id,
        class_id: session.class_id,
        class_code: session.class_code ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getSchedulerMapperMatrices = async (
  academicTermId: string,
  context: SchedulerMapperContext,
): Promise<SchedulerMatricesResult> => {
  if (!academicTermId?.trim() || isNoContext(context)) {
    return { section: [], faculty: [], room: [] };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_scheduler_matrices", {
    academic_term_id: academicTermId,
    section_id: context.sectionId ?? null,
    faculty_id: context.facultyId ?? null,
    room_id: context.roomId ?? null,
  });

  if (error) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrices ::", error);
    return {
      section: [],
      faculty: [],
      room: [],
      error: "Unable to load schedules. Please try again.",
    };
  }

  const payload = (data ?? {}) as {
    section?: unknown;
    faculty?: unknown;
    room?: unknown;
  };

  return {
    section: normalizeRpcSessions(payload.section),
    faculty: normalizeRpcSessions(payload.faculty),
    room: normalizeRpcSessions(payload.room),
  };
};

export {
  getSchedulerMapperClassListByFaculty,
  getSchedulerMapperClassListBySection,
  getSchedulerMapperClassListByRoom,
};
