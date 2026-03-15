"use server";

import { createClient } from "@/utils/supabase/server";

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
