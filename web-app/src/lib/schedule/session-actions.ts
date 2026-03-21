"use server";

import { revalidatePath } from "next/cache";
import type { SessionDay, SessionType } from "@/models";
import { createClient } from "@/utils/supabase/server";

type MutationError = { message?: string };

type ClassContext = {
  classId: string;
  userId: string;
  academicTermId: string;
  blockIds: string[];
};

type RawSessionRow = {
  id: string;
  code?: string | null;
  day?: SessionDay | null;
  start_time?: string | null;
  end_time?: string | null;
  type?: SessionType | null;
  room?:
    | {
        id?: string | null;
        code?: string | null;
        name?: string | null;
      }
    | Array<{
        id?: string | null;
        code?: string | null;
        name?: string | null;
      }>
    | null;
};

type RawClassDetailsRow = {
  id: string;
  code: string;
  user_class?:
    | Array<{
        user?: {
          id?: string;
          identity?: { name?: string | null } | Array<{ name?: string | null }> | null;
          rank?: { code?: string | null; title?: string | null } | Array<{ code?: string | null; title?: string | null }> | null;
          degree?: Array<{ title?: string | null; academic_level?: string | null; year_graduated?: number | null }> | null;
        } | Array<{
          id?: string;
          identity?: { name?: string | null } | Array<{ name?: string | null }> | null;
          rank?: { code?: string | null; title?: string | null } | Array<{ code?: string | null; title?: string | null }> | null;
          degree?: Array<{ title?: string | null; academic_level?: string | null; year_graduated?: number | null }> | null;
        }> | null;
      }>
    | null;
  course_utilization?:
    | Array<{
        course?:
          | {
              id?: string;
              code?: string | null;
              title?: string | null;
              lecture_unit?: number | null;
              laboratory_unit?: number | null;
            }
          | Array<{
              id?: string;
              code?: string | null;
              title?: string | null;
              lecture_unit?: number | null;
              laboratory_unit?: number | null;
            }>
          | null;
        block?:
          | {
              id?: string;
              code?: string | null;
              year_level?: number | null;
              section?: string | null;
              student_count?: number | null;
              major_offering?:
                | {
                    major?:
                      | { code?: string | null; name?: string | null }
                      | Array<{ code?: string | null; name?: string | null }>
                      | null;
                    program_offering?:
                      | {
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }
                      | Array<{
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }>
                      | null;
                  }
                | Array<{
                    major?:
                      | { code?: string | null; name?: string | null }
                      | Array<{ code?: string | null; name?: string | null }>
                      | null;
                    program_offering?:
                      | {
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }
                      | Array<{
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }>
                      | null;
                  }>
                | null;
            }
          | Array<{
              id?: string;
              code?: string | null;
              year_level?: number | null;
              section?: string | null;
              student_count?: number | null;
              major_offering?:
                | {
                    major?:
                      | { code?: string | null; name?: string | null }
                      | Array<{ code?: string | null; name?: string | null }>
                      | null;
                    program_offering?:
                      | {
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }
                      | Array<{
                          program?:
                            | { code?: string | null; name?: string | null }
                            | Array<{ code?: string | null; name?: string | null }>
                            | null;
                          campus?:
                            | { id?: string; name?: string | null; address?: string | null }
                            | Array<{ id?: string; name?: string | null; address?: string | null }>
                            | null;
                        }>
                      | null;
                  }
                | null;
            }>
          | null;
      }>
    | null;
};

type RawRoomRow = {
  id: string;
  code: string;
  name?: string | null;
  capacity?: number | null;
  campus_id?: string;
  campus?:
    | { id?: string; name?: string | null }
    | Array<{ id?: string; name?: string | null }>
    | null;
};

export type SchedulerDialogSession = {
  id: string;
  code: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
};

export type SchedulerDialogRoom = {
  id: string;
  code: string;
  name: string;
  capacity: number | null;
  campus_id: string;
  campus_name: string | null;
};

export type SchedulerDialogBlock = {
  id: string;
  code: string;
  year_level: number | null;
  section: string | null;
  student_count: number | null;
  program_name: string | null;
  major_name: string | null;
  campus_id: string | null;
  campus_name: string | null;
  campus_address: string | null;
};

export type SchedulerDialogDetails = {
  class_id: string;
  class_code: string;
  academic_term_id: string;
  faculty_id: string;
  faculty_name: string;
  faculty_rank: string | null;
  faculty_degrees: string[];
  course_code: string;
  course_title: string;
  lecture_unit: number;
  laboratory_unit: number;
  total_hours: number;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
  blocks: SchedulerDialogBlock[];
  rooms: SchedulerDialogRoom[];
  sessions: SchedulerDialogSession[];
};

export type SessionConflictWindow = {
  start_time: string;
  end_time: string;
  reason: string;
};

export type CreateClassSessionInput = {
  classId: string;
  type: SessionType;
  roomId: string | null;
  day: SessionDay;
  startTime: string;
  endTime: string;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const mapMutationError = (error: MutationError): string => {
  return error.message ?? "Unexpected error while saving session";
};

const toMinutes = (value: string): number => {
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  return hour * 60 + minute;
};

const overlaps = (
  leftStart: string,
  leftEnd: string,
  rightStart: string,
  rightEnd: string,
): boolean => {
  return (
    toMinutes(leftStart) < toMinutes(rightEnd) &&
    toMinutes(rightStart) < toMinutes(leftEnd)
  );
};

const normalizeDay = (value: SessionDay | null | undefined): SessionDay => {
  return value ?? "Monday";
};

const normalizeType = (value: SessionType | null | undefined): SessionType => {
  return value ?? "Lecture";
};

const getClassContext = async (classId: string): Promise<ClassContext | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class")
    .select(
      `
      id,
      user_class(user_id),
      course_utilization(block_id, block:block_id(academic_term_id))
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("lib.schedule.session-actions.getClassContext ::", error);
    }
    return null;
  }

  const row = data as { user_class?: unknown; course_utilization?: unknown };
  const userClass = first(row.user_class) as { user_id?: string } | null;
  const userId = userClass?.user_id ?? "";

  const utilizations = (row.course_utilization ?? []) as Array<{
    block_id?: string;
    block?: { academic_term_id?: string } | Array<{ academic_term_id?: string }>;
  }>;
  const blockIds = Array.from(
    new Set(
      utilizations
        .map((item) => item.block_id)
        .filter((item): item is string => Boolean(item)),
    ),
  );

  const firstUtil = utilizations[0];
  const block = first(firstUtil?.block);
  const academicTermId = block?.academic_term_id ?? "";

  if (!userId || !academicTermId) {
    return null;
  }

  return {
    classId,
    userId,
    academicTermId,
    blockIds,
  };
};

const getSessionWindowsByPredicate = async (
  academicTermId: string,
  day: SessionDay,
  options: {
    roomId?: string | null;
    facultyId?: string | null;
    blockIds?: string[];
    excludeClassId?: string;
  },
): Promise<Array<{ start_time: string; end_time: string }>> => {
  const supabase = await createClient();
  let query = supabase
    .from("session_class")
    .select(
      `
      session:session_id(start_time, end_time, day, room_id),
      class:class_id(
        id,
        user_class(user_id),
        course_utilization(block_id, block:block_id(academic_term_id))
      )
      `,
    )
    .eq("session.day", day)
    .eq("class.course_utilization.block.academic_term_id", academicTermId);

  if (options.roomId) {
    query = query.eq("session.room_id", options.roomId);
  }

  if (options.facultyId) {
    query = query.eq("class.user_class.user_id", options.facultyId);
  }

  if (options.blockIds && options.blockIds.length > 0) {
    query = query.in("class.course_utilization.block_id", options.blockIds);
  }

  if (options.excludeClassId) {
    query = query.neq("class.id", options.excludeClassId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(
      "lib.schedule.session-actions.getSessionWindowsByPredicate ::",
      error,
    );
    return [];
  }

  return (data ?? [])
    .map((item) => {
      const session = first((item as { session?: unknown }).session) as {
        start_time?: string | null;
        end_time?: string | null;
      } | null;
      if (!session?.start_time || !session?.end_time) return null;
      return { start_time: session.start_time, end_time: session.end_time };
    })
    .filter(
      (item): item is { start_time: string; end_time: string } => Boolean(item),
    );
};

export const getSessionConflictWindows = async (
  classId: string,
  day: SessionDay,
  roomId?: string | null,
): Promise<SessionConflictWindow[]> => {
  const context = await getClassContext(classId);
  if (!context) return [];

  const supabase = await createClient();
  const { data: ownSessions, error: ownSessionError } = await supabase
    .from("session_class")
    .select("session:session_id(start_time, end_time)")
    .eq("class_id", classId)
    .eq("session.day", day);

  if (ownSessionError) {
    console.error(
      "lib.schedule.session-actions.getSessionConflictWindows.own ::",
      ownSessionError,
    );
  }

  const [facultySessions, blockSessions, roomSessions] = await Promise.all([
    getSessionWindowsByPredicate(context.academicTermId, day, {
      facultyId: context.userId,
      excludeClassId: classId,
    }),
    getSessionWindowsByPredicate(context.academicTermId, day, {
      blockIds: context.blockIds,
      excludeClassId: classId,
    }),
    roomId
      ? getSessionWindowsByPredicate(context.academicTermId, day, {
          roomId,
          excludeClassId: classId,
        })
      : Promise.resolve([]),
  ]);

  const windows: SessionConflictWindow[] = [];

  (ownSessions ?? []).forEach((row) => {
    const session = first((row as { session?: unknown }).session) as {
      start_time?: string | null;
      end_time?: string | null;
    } | null;
    if (!session?.start_time || !session?.end_time) return;
    windows.push({
      start_time: session.start_time,
      end_time: session.end_time,
      reason: "Class has an existing session",
    });
  });

  facultySessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Faculty has another schedule",
    });
  });

  blockSessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Block has another schedule",
    });
  });

  roomSessions.forEach((row) => {
    windows.push({
      start_time: row.start_time,
      end_time: row.end_time,
      reason: "Room is occupied",
    });
  });

  return windows;
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
        block:block_id(
          id,
          code,
          year_level,
          section,
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

  const blocks: SchedulerDialogBlock[] = utilizations.map((util) => {
    const block = first(util.block);
    const majorOffering = first(block?.major_offering);
    const major = first(majorOffering?.major);
    const programOffering = first(majorOffering?.program_offering);
    const program = first(programOffering?.program);
    const campus = first(programOffering?.campus);

    return {
      id: block?.id ?? "",
      code: block?.code ?? "Unknown",
      year_level: block?.year_level ?? null,
      section: block?.section ?? null,
      student_count: block?.student_count ?? null,
      program_name: program?.name ?? null,
      major_name: major?.name ?? null,
      campus_id: campus?.id ?? null,
      campus_name: campus?.name ?? null,
      campus_address: campus?.address ?? null,
    };
  });

  const campusIds = Array.from(
    new Set(blocks.map((item) => item.campus_id).filter((item): item is string => Boolean(item))),
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

  const academicTermId =
    first(firstUtil?.block)?.academic_term_id ?? "";

  return {
    data: {
      class_id: classRow.id,
      class_code: classRow.code,
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
      unscheduled_laboratory_hours: Math.max(laboratoryTarget - laboratoryScheduled, 0),
      blocks,
      rooms,
      sessions,
    },
  };
};

export const createClassSession = async (
  input: CreateClassSessionInput,
): Promise<{ data?: { id: string }; error?: string }> => {
  if (!input.classId?.trim()) return { error: "Class is required" };
  if (!input.startTime?.trim() || !input.endTime?.trim()) {
    return { error: "Session time range is required" };
  }
  if (toMinutes(input.endTime) <= toMinutes(input.startTime)) {
    return { error: "End time must be after start time" };
  }

  const context = await getClassContext(input.classId);
  if (!context) {
    return { error: "Class context not found" };
  }

  const windows = await getSessionConflictWindows(input.classId, input.day, input.roomId);
  const conflict = windows.find((window) =>
    overlaps(input.startTime, input.endTime, window.start_time, window.end_time),
  );

  if (conflict) {
    return { error: `${conflict.reason} at ${conflict.start_time} - ${conflict.end_time}` };
  }

  const supabase = await createClient();
  const { data: session, error } = await supabase
    .from("session")
    .insert({
      room_id: input.roomId,
      day: input.day,
      start_time: input.startTime,
      end_time: input.endTime,
      type: input.type,
      code: "",
    })
    .select("id")
    .single();

  if (error || !session) {
    return { error: mapMutationError(error ?? {}) };
  }

  const { error: linkError } = await supabase
    .from("session_class")
    .insert({
      class_id: input.classId,
      session_id: session.id,
    });

  if (linkError) {
    return { error: mapMutationError(linkError) };
  }

  revalidatePath(`/scheduler/${context.academicTermId}/mapper`);
  return { data: { id: session.id } };
};

export const deleteClassSession = async (
  sessionId: string,
): Promise<{ data?: boolean; error?: string }> => {
  if (!sessionId?.trim()) return { error: "Session is required" };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("session_class")
    .select(
      "class_id, class:class_id(course_utilization(block:block_id(academic_term_id)))",
    )
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingError || !existing) {
    return { error: existingError?.message ?? "Session not found" };
  }

  const classRow = first((existing as { class?: unknown }).class) as {
    course_utilization?: unknown;
  } | null;
  const firstUtil = first(
    (classRow?.course_utilization ?? []) as Array<{ block?: unknown }>,
  );
  const academicTermId = first(firstUtil?.block)?.academic_term_id ?? null;

  const { error } = await supabase.from("session").delete().eq("id", sessionId);
  if (error) {
    return { error: mapMutationError(error) };
  }

  if (academicTermId) {
    revalidatePath(`/scheduler/${academicTermId}/mapper`);
  }

  return { data: true };
};
