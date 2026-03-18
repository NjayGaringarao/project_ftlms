"use server";

import { createClient } from "@/utils/supabase/server";
import { SessionDay } from "@/models";

export type SchedulerMapperContext = {
  facultyId?: string | null;
  blockId?: string | null;
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
  class_code: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
};

type RawClassSessionRow = {
  type?: "Lecture" | "Laboratory" | null;
  start_time?: string | null;
  end_time?: string | null;
};

type RawClassCourseRow = {
  lecture_unit?: number | null;
  laboratory_unit?: number | null;
};

type RawClassRow = {
  id: string;
  code: string;
  course?: RawClassCourseRow | RawClassCourseRow[] | null;
  session?: RawClassSessionRow[] | null;
};

type RawMatrixSessionRow = {
  id?: string | null;
  day?: SessionDay | string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type RawMatrixClassRow = {
  id: string;
  code: string;
  session?: RawMatrixSessionRow[] | null;
};

type RawMatrixRoomSessionRow = {
  id?: string | null;
  day?: SessionDay | string | null;
  start_time?: string | null;
  end_time?: string | null;
  class?: {
    code?: string | null;
  } | null;
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
  return !context.facultyId && !context.blockId && !context.roomId;
};

const normalizeSessionDay = (value: string | null | undefined): SessionDay | null => {
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

const mapMatrixSessions = (
  rows: RawMatrixClassRow[],
): SchedulerMatrixSession[] => {
  const sessions: SchedulerMatrixSession[] = [];

  rows.forEach((row) => {
    (row.session ?? []).forEach((session) => {
      const normalizedDay = normalizeSessionDay(session?.day ?? null);
      if (!session?.id || !normalizedDay || !session.start_time || !session.end_time) {
        return;
      }

      sessions.push({
        id: session.id,
        class_code: row.code,
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      });
    });
  });

  return sessions;
};

export const getSchedulerMapperClassList = async (
  academicTermId: string,
  context: SchedulerMapperContext,
): Promise<SchedulerMapperClassListItem[]> => {
  if (!academicTermId?.trim() || isNoContext(context)) {
    return [];
  }

  const supabase = await createClient();

  let query = supabase
    .from("class")
    .select(
      `
      id,
      code,
      course:course_id(lecture_unit, laboratory_unit),
      schedule:schedule_id!inner(id, user_id, academic_term_id),
      class_block(block_id),
      session(type, start_time, end_time, room_id)
      `,
    )
    .eq("schedule.academic_term_id", academicTermId)
    .order("code", { ascending: true });

  if (context.facultyId) {
    query = query.eq("schedule.user_id", context.facultyId);
  }

  if (context.blockId) {
    const { data: blockData, error: blockError } = await supabase
      .from("class_block")
      .select("class_id")
      .eq("block_id", context.blockId);

    if (blockError) {
      console.error("lib.schedule.mapper.getSchedulerMapperClassList :: block pre-filter ::", blockError);
      return [];
    }

    const classIds = (blockData ?? []).map((r) => r.class_id as string);
    if (classIds.length === 0) return [];
    query = query.in("id", classIds);
  }

  if (context.roomId) {
    const { data: sessionData, error: sessionError } = await supabase
      .from("session")
      .select("class_id")
      .eq("room_id", context.roomId);

    if (sessionError) {
      console.error("lib.schedule.mapper.getSchedulerMapperClassList :: room pre-filter ::", sessionError);
      return [];
    }

    const classIds = (sessionData ?? []).map((r) => r.class_id as string);
    if (classIds.length === 0) return [];
    query = query.in("id", classIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("lib.schedule.mapper.getSchedulerMapperClassList ::", error);
    return [];
  }

  return ((data ?? []) as RawClassRow[]).map((row) => {
    const course = first(row.course);
    const lectureTarget = Number(course?.lecture_unit ?? 0);
    const laboratoryTarget = Number(course?.laboratory_unit ?? 0) * 3;

    const sessions = row.session ?? [];
    const scheduledLectureHours = sessions
      .filter((session) => session.type === "Lecture")
      .reduce((sum, session) => {
        const minutes = toMinutes(session.end_time) - toMinutes(session.start_time);
        return sum + toHours(minutes);
      }, 0);

    const scheduledLaboratoryHours = sessions
      .filter((session) => session.type === "Laboratory")
      .reduce((sum, session) => {
        const minutes = toMinutes(session.end_time) - toMinutes(session.start_time);
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

const getSchedulerMapperClassListByBlock = async (
  academicTermId: string,
  blockId: string,
): Promise<SchedulerMapperClassListItem[]> => {
  return getSchedulerMapperClassList(academicTermId, { blockId });
};

const getSchedulerMapperClassListByRoom = async (
  academicTermId: string,
  roomId: string,
): Promise<SchedulerMapperClassListItem[]> => {
  return getSchedulerMapperClassList(academicTermId, { roomId });
};

export const getSchedulerMapperMatrixByFaculty = async (
  academicTermId: string,
  facultyId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !facultyId?.trim()) {
    return [];
  }

  const supabase = await createClient();

  const { data: classData, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      schedule:schedule_id!inner(id, user_id, academic_term_id)
      `,
    )
    .eq("schedule.academic_term_id", academicTermId)
    .eq("schedule.user_id", facultyId);

  if (classError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByFaculty :: class query ::", classError);
    return [];
  }

  const classRows = (classData ?? []) as RawMatrixClassRow[];
  if (classRows.length === 0) return [];

  const classIds = classRows.map((row) => row.id);
  const classCodeMap = new Map(classRows.map((row) => [row.id, row.code]));

  const { data: sessionData, error: sessionError } = await supabase
    .from("session")
    .select("id, class_id, day, start_time, end_time")
    .in("class_id", classIds);

  if (sessionError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByFaculty :: session query ::", sessionError);
    return [];
  }

  return (sessionData ?? [])
    .map((session) => {
      const normalizedDay = normalizeSessionDay(session.day ?? null);
      if (!session.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_code: classCodeMap.get(session.class_id) ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getSchedulerMapperMatrixByBlock = async (
  academicTermId: string,
  blockId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !blockId?.trim()) {
    return [];
  }

  const supabase = await createClient();

  const { data: blockData, error: blockError } = await supabase
    .from("class_block")
    .select("class_id")
    .eq("block_id", blockId);

  if (blockError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByBlock :: block pre-filter ::", blockError);
    return [];
  }

  const classIds = (blockData ?? []).map((r) => r.class_id as string);
  if (classIds.length === 0) return [];

  const { data: classData, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      schedule:schedule_id!inner(id, academic_term_id)
      `,
    )
    .eq("schedule.academic_term_id", academicTermId)
    .in("id", classIds);

  if (classError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByBlock :: class query ::", classError);
    return [];
  }

  const classRows = (classData ?? []) as RawMatrixClassRow[];
  if (classRows.length === 0) return [];

  const classIdsForSessions = classRows.map((row) => row.id);
  const classCodeMap = new Map(classRows.map((row) => [row.id, row.code]));

  const { data: sessionData, error: sessionError } = await supabase
    .from("session")
    .select("id, class_id, day, start_time, end_time")
    .in("class_id", classIdsForSessions);

  if (sessionError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByBlock :: session query ::", sessionError);
    return [];
  }

  return (sessionData ?? [])
    .map((session) => {
      const normalizedDay = normalizeSessionDay(session.day ?? null);
      if (!session.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_code: classCodeMap.get(session.class_id) ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export const getSchedulerMapperMatrixByRoom = async (
  academicTermId: string,
  roomId: string,
): Promise<SchedulerMatrixSession[]> => {
  if (!academicTermId?.trim() || !roomId?.trim()) {
    return [];
  }

  const supabase = await createClient();

  const { data: sessionData, error: sessionError } = await supabase
    .from("session")
    .select("id, class_id, day, start_time, end_time")
    .eq("room_id", roomId);

  if (sessionError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByRoom :: session query ::", sessionError);
    return [];
  }

  const sessionRows = sessionData ?? [];
  if (sessionRows.length === 0) return [];

  const classIds = Array.from(new Set(sessionRows.map((row) => row.class_id)));

  const { data: classData, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      schedule:schedule_id!inner(id, academic_term_id)
      `,
    )
    .eq("schedule.academic_term_id", academicTermId)
    .in("id", classIds);

  if (classError) {
    console.error("lib.schedule.mapper.getSchedulerMapperMatrixByRoom :: class query ::", classError);
    return [];
  }

  const classCodeMap = new Map(
    ((classData ?? []) as RawMatrixClassRow[]).map((row) => [row.id, row.code]),
  );

  return sessionRows
    .map((session) => {
      if (!classCodeMap.has(session.class_id)) return null;

      const normalizedDay = normalizeSessionDay(session.day ?? null);
      if (!session.id || !normalizedDay || !session.start_time || !session.end_time) {
        return null;
      }

      return {
        id: session.id,
        class_code: classCodeMap.get(session.class_id) ?? "Unknown",
        day: normalizedDay,
        start_time: session.start_time,
        end_time: session.end_time,
      };
    })
    .filter((row): row is SchedulerMatrixSession => Boolean(row));
};

export {
  getSchedulerMapperClassListByFaculty,
  getSchedulerMapperClassListByBlock,
  getSchedulerMapperClassListByRoom,
};
