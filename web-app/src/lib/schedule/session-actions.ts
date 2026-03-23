"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import type { SessionDay, SessionType } from "@/models";
import { createClient } from "@/utils/supabase/server";

type MutationError = { message?: string };

type ClassContext = {
  classId: string;
  userId: string | null;
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
  room_id?: string | null;
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

type RawIdentityRow = { name?: string | null };
type RawRankRow = { code?: string | null; title?: string | null };
type RawDegreeRow = {
  title?: string | null;
  academic_level?: string | null;
  year_graduated?: number | null;
};

type RawProgramRow = {
  code?: string | null;
  name?: string | null;
  college_id?: string | null;
};

type RawCampusRow = {
  id?: string | null;
  name?: string | null;
  address?: string | null;
};

type RawProgramOfferingRow = {
  program?: RawProgramRow | RawProgramRow[] | null;
  campus_id?: string | null;
  campus?: RawCampusRow | RawCampusRow[] | null;
};

type RawMajorRow = { code?: string | null; name?: string | null };

type RawMajorOfferingRow = {
  major?: RawMajorRow | RawMajorRow[] | null;
  program_offering?: RawProgramOfferingRow | RawProgramOfferingRow[] | null;
};

type RawBlockRow = {
  id?: string;
  code?: string | null;
  year_level?: number | null;
  section?: string | null;
  student_count?: number | null;
  academic_term_id?: string | null;
  major_offering?: RawMajorOfferingRow | RawMajorOfferingRow[] | null;
};

type RawCourseRow = {
  id?: string;
  code?: string | null;
  title?: string | null;
  lecture_unit?: number | null;
  laboratory_unit?: number | null;
};

type RawClassDetailsRow = {
  id: string;
  code?: string | null;
  user_class?:
    | Array<{
        user?:
          | {
              id?: string;
              identity?: RawIdentityRow | RawIdentityRow[] | null;
              rank?: RawRankRow | RawRankRow[] | null;
              degree?: RawDegreeRow[] | null;
            }
          | Array<{
              id?: string;
              identity?: RawIdentityRow | RawIdentityRow[] | null;
              rank?: RawRankRow | RawRankRow[] | null;
              degree?: RawDegreeRow[] | null;
            }>
          | null;
      }>
    | null;
  course_utilization?:
    | Array<{
        course?: RawCourseRow | RawCourseRow[] | null;
        block?: RawBlockRow | RawBlockRow[] | null;
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
    | { id?: string; code?: string | null; name?: string | null }
    | Array<{ id?: string; code?: string | null; name?: string | null }>
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

export type SessionSummary = {
  session_id: string;
  class_id: string;
  class_code: string;
  course_code: string | null;
  course_title: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
  room_id: string | null;
  room_code: string | null;
  room_name: string | null;
  campus_id: string | null;
  college_id: string | null;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  block_codes: string[];
};

export type SessionRoomOption = {
  id: string;
  code: string;
  name: string;
  campus_name: string | null;
  campus_id: string | null;
  campus_code: string | null;
  capacity: number | null;
};

export type CreateClassSessionInput = {
  classId: string;
  type: SessionType;
  roomId: string | null;
  day: SessionDay;
  startTime: string;
  endTime: string;
  facultyId?: string | null;
};

export type CreateSessionFromOfferingInput = {
  academicTermId: string;
  blockId: string;
  courseUtilizationId: string;
  facultyId: string;
  roomId: string | null;
  day: SessionDay;
  startTime: string;
  endTime: string;
  type: SessionType;
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

const unlinkFacultyIfNoSessions = async (
  supabase: Awaited<ReturnType<typeof createClient>>,
  classId: string,
): Promise<void> => {
  const { data: remaining, error } = await supabase
    .from("session_class")
    .select("session_id")
    .eq("class_id", classId)
    .limit(1);

  if (error) {
    console.error(
      "lib.schedule.session-actions.unlinkFacultyIfNoSessions ::",
      error,
    );
    return;
  }

  if (!remaining || remaining.length === 0) {
    await supabase.from("user_class").delete().eq("class_id", classId);
  }
};

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
          block:block_id(
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
    .in("session_id", sessionIds);

  if (error) {
    console.error("lib.schedule.session-actions.getSessionSummaries ::", error);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const session = first((row as { session?: unknown }).session) as RawSessionRow | null;
      const cls = first((row as { class?: unknown }).class) as RawClassDetailsRow | null;
      if (!session?.id || !cls?.id) return null;

      const userClass = first(cls.user_class) as { user?: unknown } | null;
      const facultyRow = first(userClass?.user) as { id?: string; identity?: unknown } | null;
      const facultyIdentity = first(facultyRow?.identity) as { name?: string } | null;

      const utilizations = cls.course_utilization ?? [];
      const firstUtil = utilizations[0];
      const course = first(firstUtil?.course) as {
        code?: string | null;
        title?: string | null;
      } | null;

      const blockCodes = utilizations
        .map((util) => first(util.block))
        .filter((block): block is { code?: string | null } => Boolean(block))
        .map((block) => block.code ?? "Unknown");

      const campusIds = new Set(
        utilizations
          .map((util) => first(util.block))
          .map((block) => first(block?.major_offering))
          .map((majorOffering) => first(majorOffering?.program_offering))
          .map((programOffering) => programOffering?.campus_id)
          .filter((id): id is string => Boolean(id)),
      );
      const campusId = campusIds.size === 1 ? Array.from(campusIds)[0] : null;

      const collegeIds = new Set(
        utilizations
          .map((util) => first(util.block))
          .map((block) => first(block?.major_offering))
          .map((majorOffering) => first(majorOffering?.program_offering))
          .map((programOffering) => first(programOffering?.program))
          .map((program) => program?.college_id)
          .filter((id): id is string => Boolean(id)),
      );
      const collegeId = collegeIds.size === 1 ? Array.from(collegeIds)[0] : null;

      const room = first(session?.room);

      return {
        session_id: session.id ?? "",
        class_id: cls.id ?? "",
        class_code: cls.code ?? "Unknown",
        course_code: course?.code ?? null,
        course_title: course?.title ?? null,
        faculty_id: facultyRow?.id ?? null,
        faculty_name: facultyIdentity?.name ?? null,
        room_id: session.room_id ?? null,
        room_code: room?.code ?? null,
        room_name: room?.name ?? null,
        campus_id: campusId,
        college_id: collegeId,
        day: normalizeDay(session.day),
        start_time: session.start_time ?? "00:00:00",
        end_time: session.end_time ?? "00:00:00",
        type: normalizeType(session.type),
        block_codes: Array.from(new Set(blockCodes)),
      };
    })
    .filter((row): row is SessionSummary => Boolean(row));
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
          block:block_id(
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

  return (data ?? [])
    .map((row) => {
      const session = first((row as { session?: unknown }).session) as
        | RawSessionRow
        | null;
      const cls = first((row as { class?: unknown }).class) as
        | RawClassDetailsRow
        | null;
      if (!session?.id || !cls?.id) return null;

      const userClass = first(cls.user_class) as { user?: unknown } | null;
      const facultyRow = first(userClass?.user) as { id?: string; identity?: unknown } | null;
      const facultyIdentity = first(facultyRow?.identity) as { name?: string } | null;

      const utilizations = cls.course_utilization ?? [];
      const firstUtil = utilizations[0];
      const course = first(firstUtil?.course) as {
        code?: string | null;
        title?: string | null;
      } | null;

      const blockCodes = utilizations
        .map((util) => first(util.block))
        .filter((block): block is { code?: string | null } => Boolean(block))
        .map((block) => block.code ?? "Unknown");

      const campusIds = new Set(
        utilizations
          .map((util) => first(util.block))
          .map((block) => first(block?.major_offering))
          .map((majorOffering) => first(majorOffering?.program_offering))
          .map((programOffering) => programOffering?.campus_id)
          .filter((id): id is string => Boolean(id)),
      );
      const campusId = campusIds.size === 1 ? Array.from(campusIds)[0] : null;

      const collegeIds = new Set(
        utilizations
          .map((util) => first(util.block))
          .map((block) => first(block?.major_offering))
          .map((majorOffering) => first(majorOffering?.program_offering))
          .map((programOffering) => first(programOffering?.program))
          .map((program) => program?.college_id)
          .filter((id): id is string => Boolean(id)),
      );
      const collegeId = collegeIds.size === 1 ? Array.from(collegeIds)[0] : null;

      const room = first(session?.room);

      return {
        session_id: session.id ?? "",
        class_id: cls.id ?? "",
        class_code: cls.code ?? "Unknown",
        course_code: course?.code ?? null,
        course_title: course?.title ?? null,
        faculty_id: facultyRow?.id ?? null,
        faculty_name: facultyIdentity?.name ?? null,
        room_id: session.room_id ?? null,
        room_code: room?.code ?? null,
        room_name: room?.name ?? null,
        campus_id: campusId,
        college_id: collegeId,
        day: normalizeDay(session.day),
        start_time: session.start_time ?? "00:00:00",
        end_time: session.end_time ?? "00:00:00",
        type: normalizeType(session.type),
        block_codes: Array.from(new Set(blockCodes)),
      };
    })
    .filter((row): row is SessionSummary => Boolean(row));
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
      id,
      course_utilization(
        block:block_id(
          major_offering:major_offering_id(
            program_offering:program_offering_id(
              campus_id
            )
          )
        )
      )
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (classError || !classData) {
    console.error("lib.schedule.session-actions.getRoomsForClass ::", classError);
    return [];
  }

  const utilizations = (classData as RawClassDetailsRow).course_utilization ?? [];
  const campusIds = Array.from(
    new Set(
      utilizations
        .map((util) => first(util.block))
        .map((block) => first(block?.major_offering))
        .map((majorOffering) => first(majorOffering?.program_offering))
        .map((programOffering) => programOffering?.campus_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const roomsResult = campusIds.length
    ? await supabase
        .from("room")
        .select(
          "id, code, name, capacity, campus_id, campus:campus_id(id, code, name)",
        )
        .in("campus_id", campusIds)
        .order("code", { ascending: true })
    : await supabase
        .from("room")
        .select(
          "id, code, name, capacity, campus_id, campus:campus_id(id, code, name)",
        )
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
  const userId = userClass?.user_id ?? null;

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

  if (!academicTermId) {
    return null;
  }

  return {
    classId,
    userId,
    academicTermId,
    blockIds,
  };
};

type SessionContext = {
  sessionId: string;
  classId: string;
  facultyId: string;
  academicTermId: string;
  blockIds: string[];
  day: SessionDay;
  start_time: string;
  end_time: string;
};

const getSessionContext = async (
  sessionId: string,
): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("session_class")
    .select(
      `
      class_id,
      session:session_id(day, start_time, end_time),
      class:class_id(
        user_class(user_id),
        course_utilization(block_id, block:block_id(academic_term_id))
      )
      `,
    )
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.error("lib.schedule.session-actions.getSessionContext ::", error);
    }
    return null;
  }

  const session = first((data as { session?: unknown }).session) as {
    day?: SessionDay | null;
    start_time?: string | null;
    end_time?: string | null;
  } | null;
  const classRow = first((data as { class?: unknown }).class) as {
    user_class?: unknown;
    course_utilization?: unknown;
  } | null;

  const userClass = first(classRow?.user_class) as { user_id?: string } | null;
  const facultyId = userClass?.user_id ?? "";
  const utilizations = (classRow?.course_utilization ?? []) as Array<{
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

  if (
    !session?.day ||
    !session.start_time ||
    !session.end_time ||
    !academicTermId
  ) {
    return null;
  }

  return {
    sessionId,
    classId: data.class_id as string,
    facultyId,
    academicTermId,
    blockIds,
    day: session.day,
    start_time: session.start_time,
    end_time: session.end_time,
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
    excludeSessionId?: string;
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

  if (options.excludeSessionId) {
    query = query.neq("session.id", options.excludeSessionId);
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
  facultyId?: string | null,
): Promise<SessionConflictWindow[]> => {
  const context = await getClassContext(classId);
  if (!context) return [];
  const conflictFacultyId = facultyId ?? context.userId ?? null;

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
    conflictFacultyId
      ? getSessionWindowsByPredicate(context.academicTermId, day, {
          facultyId: conflictFacultyId,
          excludeClassId: classId,
        })
      : Promise.resolve([]),
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

  const windows = await getSessionConflictWindows(
    input.classId,
    input.day,
    input.roomId,
    input.facultyId ?? null,
  );
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

export const createSessionFromOffering = async (
  input: CreateSessionFromOfferingInput,
): Promise<{ data?: { id: string }; error?: string }> => {
  if (!input.academicTermId?.trim()) return { error: "Academic term is required" };
  if (!input.blockId?.trim()) return { error: "Block is required" };
  if (!input.courseUtilizationId?.trim()) return { error: "Course offering is required" };
  if (!input.facultyId?.trim()) return { error: "Faculty is required" };

  const supabase = await createClient();
  const { data: utilization, error } = await supabase
    .from("course_utilization")
    .select("id, class_id, block_id, block:block_id(academic_term_id)")
    .eq("id", input.courseUtilizationId)
    .maybeSingle();

  if (error || !utilization) {
    return { error: error?.message ?? "Course offering not found" };
  }

  const block = first((utilization as { block?: unknown }).block) as {
    academic_term_id?: string | null;
  } | null;

  if (utilization.block_id !== input.blockId) {
    return { error: "Course offering does not belong to the selected block" };
  }

  if (block?.academic_term_id !== input.academicTermId) {
    return { error: "Course offering does not belong to the selected term" };
  }

  let classId = utilization.class_id as string | null;

  if (!classId) {
    const { data: newClass, error: classError } = await supabase
      .from("class")
      .insert({ code: `TMP-${randomUUID()}` })
      .select("id")
      .single();

    if (classError || !newClass) {
      return { error: classError?.message ?? "Unable to create class" };
    }

    const { error: linkError } = await supabase
      .from("course_utilization")
      .update({ class_id: newClass.id })
      .eq("id", utilization.id);

    if (linkError) {
      return { error: linkError.message };
    }

    classId = newClass.id;
  }

  if (!classId) {
    return { error: "Unable to resolve class for this offering" };
  }

  const { data: existingUserClass, error: userClassError } = await supabase
    .from("user_class")
    .select("user_id")
    .eq("class_id", classId)
    .maybeSingle();

  if (userClassError) {
    return { error: userClassError.message };
  }

  if (existingUserClass?.user_id && existingUserClass.user_id !== input.facultyId) {
    return { error: "Class is already assigned to a different faculty" };
  }

  const sessionResult = await createClassSession({
    classId,
    type: input.type,
    roomId: input.roomId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    facultyId: input.facultyId,
  });

  if (sessionResult.error || !sessionResult.data) {
    return sessionResult;
  }

  if (!existingUserClass?.user_id) {
    const { error: insertUserClassError } = await supabase
      .from("user_class")
      .insert({ user_id: input.facultyId, class_id: classId });
    if (insertUserClassError) {
      return { error: insertUserClassError.message };
    }
  }

  return sessionResult;
};

export const updateSessionRoom = async (
  sessionId: string,
  roomId: string | null,
): Promise<{ data?: boolean; error?: string }> => {
  if (!sessionId?.trim()) return { error: "Session is required" };

  const context = await getSessionContext(sessionId);
  if (!context) return { error: "Session context not found" };

  const [facultyWindows, blockWindows, roomWindows] = await Promise.all([
    context.facultyId
      ? getSessionWindowsByPredicate(context.academicTermId, context.day, {
          facultyId: context.facultyId,
          excludeSessionId: sessionId,
        })
      : Promise.resolve([]),
    getSessionWindowsByPredicate(context.academicTermId, context.day, {
      blockIds: context.blockIds,
      excludeSessionId: sessionId,
    }),
    roomId
      ? getSessionWindowsByPredicate(context.academicTermId, context.day, {
          roomId,
          excludeSessionId: sessionId,
        })
      : Promise.resolve([]),
  ]);

  const conflicts: Array<{ start_time: string; end_time: string; reason: string }> = [];
  facultyWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Faculty has another schedule" }),
  );
  blockWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Block has another schedule" }),
  );
  roomWindows.forEach((window) =>
    conflicts.push({ ...window, reason: "Room is occupied" }),
  );

  const conflict = conflicts.find((window) =>
    overlaps(context.start_time, context.end_time, window.start_time, window.end_time),
  );

  if (conflict) {
    return {
      error: `${conflict.reason} at ${conflict.start_time} - ${conflict.end_time}`,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("session")
    .update({ room_id: roomId })
    .eq("id", sessionId);

  if (error) {
    return { error: mapMutationError(error) };
  }

  revalidatePath(`/scheduler/${context.academicTermId}/mapper`);
  return { data: true };
};

export const replaceClassFaculty = async (
  classId: string,
  facultyId: string,
): Promise<{ data?: boolean; error?: string }> => {
  if (!classId?.trim()) return { error: "Class is required" };
  if (!facultyId?.trim()) return { error: "Faculty is required" };

  const supabase = await createClient();
  const { data: classSessions, error: sessionError } = await supabase
    .from("session_class")
    .select("session:session_id(day, start_time, end_time)")
    .eq("class_id", classId);

  if (sessionError) {
    return { error: sessionError.message };
  }

  if (!classSessions || classSessions.length === 0) {
    return { error: "Assign faculty after scheduling sessions." };
  }

  const { data: classRow, error: classContextError } = await supabase
    .from("class")
    .select(
      `
      id,
      course_utilization(block_id, block:block_id(academic_term_id))
      `,
    )
    .eq("id", classId)
    .maybeSingle();

  if (classContextError || !classRow) {
    return { error: classContextError?.message ?? "Class context not found" };
  }

  const utilizations = (classRow as { course_utilization?: unknown })
    .course_utilization as Array<{
    block_id?: string;
    block?: { academic_term_id?: string } | Array<{ academic_term_id?: string }>;
  }> | null;

  const blockIds = Array.from(
    new Set(
      (utilizations ?? [])
        .map((item) => item.block_id)
        .filter((item): item is string => Boolean(item)),
    ),
  );
  const firstUtil = (utilizations ?? [])[0];
  const block = first(firstUtil?.block);
  const academicTermId = block?.academic_term_id ?? "";

  if (!academicTermId) {
    return { error: "Academic term not found for class" };
  }

  const sessions = (classSessions ?? [])
    .map(
      (row) =>
        first((row as { session?: unknown }).session) as
          | { day?: SessionDay | null; start_time?: string | null; end_time?: string | null }
          | null,
    )
    .filter(
      (row): row is { day: SessionDay; start_time: string; end_time: string } =>
        Boolean(row?.day && row?.start_time && row?.end_time),
    );

  for (const session of sessions) {
    const windows = await getSessionWindowsByPredicate(
      academicTermId,
      normalizeDay(session.day),
      {
        facultyId,
        excludeClassId: classId,
      },
    );

    const conflict = windows.find((window) =>
      overlaps(
        session.start_time ?? "",
        session.end_time ?? "",
        window.start_time,
        window.end_time,
      ),
    );

    if (conflict) {
      return {
        error: `Faculty has a conflict at ${conflict.start_time} - ${conflict.end_time}`,
      };
    }
  }

  await supabase.from("user_class").delete().eq("class_id", classId);
  const { error: userClassError } = await supabase.from("user_class").insert({
    class_id: classId,
    user_id: facultyId,
  });

  if (userClassError) {
    return { error: userClassError.message };
  }

  revalidatePath(`/scheduler/${academicTermId}/mapper`);
  return { data: true };
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
    (classRow?.course_utilization ?? []) as Array<{
      block?: RawBlockRow | RawBlockRow[] | null;
    }>,
  );
  const academicTermId = first(firstUtil?.block)?.academic_term_id ?? null;

  const { error } = await supabase.from("session").delete().eq("id", sessionId);
  if (error) {
    return { error: mapMutationError(error) };
  }

  await unlinkFacultyIfNoSessions(supabase, existing.class_id as string);

  if (academicTermId) {
    revalidatePath(`/scheduler/${academicTermId}/mapper`);
  }

  return { data: true };
};
