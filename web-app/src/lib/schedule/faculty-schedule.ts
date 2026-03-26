"use server";

import { createClient } from "@/utils/supabase/server";
import { SessionDay, SessionType } from "@/models";
import {
  FacultySchedulePageData,
  FacultyScheduleRow,
  FacultyScheduleTermSnapshot,
  FacultyScheduleSessionInfo,
  FacultyTeachingLoadRow,
  ScheduleAcademicTermOption,
} from "./types";
import {
  computeTeachingLoad,
  mergeBlockLabels,
  sortScheduleRows,
  toMinutes,
} from "./utils";

type ClassBlockRow = {
  block?: {
    id?: string | null;
    code?: string | null;
    student_count?: number | null;
    year_level?: number | null;
    section?: string | null;
    major_offering?: {
      program_offering?: {
        campus?: {
          name?: string | null;
        } | null;
      } | null;
    } | null;
  } | null;
};

type ClassSessionRow = {
  id: string;
  day: SessionDay;
  start_time: string;
  end_time: string;
  type: SessionType;
  room?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

type ClassRow = {
  id: string;
  code: string;
  course_utilization?: Array<{
    course?: {
      code?: string | null;
      title?: string | null;
      lecture_unit?: number | null;
      laboratory_unit?: number | null;
    } | Array<{
      code?: string | null;
      title?: string | null;
      lecture_unit?: number | null;
      laboratory_unit?: number | null;
    }> | null;
    block?: ClassBlockRow["block"] | Array<ClassBlockRow["block"]> | null;
  }> | null;
  session_class?: Array<{
    session?: ClassSessionRow | ClassSessionRow[] | null;
  }> | null;
};

const SESSION_DAY_ORDER: Record<SessionDay, number> = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

type RawScheduleTermRow = {
  id: string;
  code: string;
  academic_year_id: string;
  name: ScheduleAcademicTermOption["name"];
  start: string;
  end: string;
  academic_year:
    | {
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }
    | Array<{
        id: string;
        code: string;
        start_year: number;
        end_year: number;
      }>;
};

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const getAcademicTerms = async (): Promise<ScheduleAcademicTermOption[]> => {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_id, name, start, end, academic_year:academic_year_id(id, code, start_year, end_year)",
    )
    .order("start", { ascending: false });

  if (error) {
    console.error("lib.schedule.getAcademicTerms ::", error);
    return [];
  }

  return ((data ?? []) as RawScheduleTermRow[]).map((term) => {
    const academicYear = Array.isArray(term.academic_year)
      ? term.academic_year[0]
      : term.academic_year;

    return {
      ...term,
      academic_year: academicYear,
      is_active: today >= term.start && today <= term.end,
    };
  });
};

const resolveSelectedTerm = (
  terms: ScheduleAcademicTermOption[],
  requestedTermId: string | null,
): ScheduleAcademicTermOption | null => {
  if (terms.length === 0) return null;

  if (requestedTermId) {
    const matched = terms.find((term) => term.id === requestedTermId);
    if (matched) return matched;
  }

  const activeTerm = terms.find((term) => term.is_active);
  if (activeTerm) return activeTerm;

  return terms[0] ?? null;
};

const getClassRowsByFacultyAndTerm = async (
  userId: string,
  academicTermId: string,
): Promise<ClassRow[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_class")
    .select(
      `
      class:class_id(
        id,
        code,
        course_utilization(
          course:course_id(code, title, lecture_unit, laboratory_unit),
          block:block_id(
            id,
            code,
            student_count,
            year_level,
            section,
            major_offering:major_offering_id(
              program_offering:program_offering_id(
                campus:campus_id(name)
              )
            )
          )
        ),
        session_class(
          session:session_id(
            id,
            day,
            start_time,
            end_time,
            type,
            room:room_id(code, name)
          )
        )
      )
      `,
    )
    .eq("user_id", userId)
    .eq("class.course_utilization.block.academic_term_id", academicTermId);

  if (error) {
    console.error("lib.schedule.getClassRowsByFacultyAndTerm ::", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const cls = row.class as ClassRow | ClassRow[] | null | undefined;
    if (!cls) return [];
    return Array.isArray(cls) ? cls : [cls];
  });
};

const formatBlockLabel = (
  yearLevel: number | null | undefined,
  section: string | null | undefined,
): string | null => {
  if (!yearLevel || !section) return null;
  return `${yearLevel}${section}`;
};

const mapSession = (session: ClassSessionRow): FacultyScheduleSessionInfo => {
  return {
    id: session.id,
    day: session.day,
    start_time: session.start_time,
    end_time: session.end_time,
    type: session.type,
    room_code: session.room?.code ?? null,
    room_name: session.room?.name ?? null,
  };
};

const formatRoomLabel = (session: FacultyScheduleSessionInfo): string | null => {
  if (!session.room_code && !session.room_name) return null;
  if (!session.room_code) return session.room_name ?? null;
  if (!session.room_name) return session.room_code;
  return `${session.room_code}`;
};

const toSessionHours = (session: FacultyScheduleSessionInfo): number => {
  const durationMinutes = toMinutes(session.end_time) - toMinutes(session.start_time);
  if (durationMinutes <= 0) return 0;
  return Number((durationMinutes / 60).toFixed(2));
};

const mapTeachingLoadRows = (classRows: ClassRow[]): FacultyTeachingLoadRow[] => {
  return classRows.map((item) => {
    const firstUtil = (item.course_utilization ?? [])[0];
    const course = first(firstUtil?.course);
    const lectureHour = Number(course?.lecture_unit ?? 0);
    const laboratoryHour = Number(course?.laboratory_unit ?? 0);

    const blocks = (item.course_utilization ?? [])
      .map((entry) => first(entry.block))
      .filter(Boolean)
      .map((block) =>
        formatBlockLabel(block?.year_level ?? null, block?.section ?? null),
      )
      .filter((value): value is string => Boolean(value));

    const campusLabel = Array.from(
      new Set(
        (item.course_utilization ?? [])
          .map((entry) => {
            const block = first(entry.block);
            const majorOffering = first(block?.major_offering);
            const programOffering = first(majorOffering?.program_offering);
            const campus = first(programOffering?.campus);
            return campus?.name ?? null;
          })
          .filter((value): value is string => Boolean(value)),
      ),
    ).join(", ");

    return {
      class_id: item.id,
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      lecture_hour: lectureHour,
      laboratory_hour: laboratoryHour,
      load: computeTeachingLoad(lectureHour, laboratoryHour),
      blocks,
      merged_block_label: mergeBlockLabels(blocks),
      campus_label: campusLabel || "Not assigned",
    };
  });
};

const mapScheduleRows = (classRows: ClassRow[]): FacultyScheduleRow[] => {
  const rows: FacultyScheduleRow[] = [];

  classRows.forEach((item) => {
    const firstUtil = (item.course_utilization ?? [])[0];
    const course = first(firstUtil?.course);
    const blockRows = (item.course_utilization ?? [])
      .map((entry) => first(entry.block))
      .filter((block): block is NonNullable<typeof block> => Boolean(block));

    const blockCodes = Array.from(
      new Set(
        blockRows
          .map((block) => block.code?.trim() ?? "")
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const seenBlockIds = new Set<string>();
    const uniqueBlockRows = blockRows.filter((block) => {
      const dedupeKey = block.id?.trim() || block.code?.trim() || "";
      if (!dedupeKey) return true;
      if (seenBlockIds.has(dedupeKey)) return false;
      seenBlockIds.add(dedupeKey);
      return true;
    });

    const studentCount = uniqueBlockRows.reduce(
      (sum, block) => sum + Number(block.student_count ?? 0),
      0,
    );
    const mergedBlockCodeLabel = mergeBlockLabels(blockCodes);
    const sessions = (item.session_class ?? [])
      .map((entry) => first(entry.session))
      .filter((session): session is ClassSessionRow => Boolean(session))
      .map(mapSession);

    if (sessions.length === 0) {
      rows.push({
        row_id: `${item.id}:no-session`,
        class_id: item.id,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        block_codes_label: mergedBlockCodeLabel,
        student_count: studentCount > 0 ? studentCount : null,
        lecture_hours: null,
        lecture_room: null,
        laboratory_hours: null,
        laboratory_room: null,
        session_days: [],
        session: null,
      });
      return;
    }

    const groupedSessions = new Map<
      string,
      { representative: FacultyScheduleSessionInfo; days: Set<SessionDay> }
    >();

    sessions.forEach((session) => {
      const roomKey = session.room_code ?? session.room_name ?? "";
      const sessionGroupKey = [
        session.type,
        session.start_time,
        session.end_time,
        roomKey,
      ].join("|");

      const existingGroup = groupedSessions.get(sessionGroupKey);
      if (!existingGroup) {
        groupedSessions.set(sessionGroupKey, {
          representative: session,
          days: new Set([session.day]),
        });
        return;
      }

      existingGroup.days.add(session.day);

      const existingDayOrder = SESSION_DAY_ORDER[existingGroup.representative.day];
      const currentDayOrder = SESSION_DAY_ORDER[session.day];
      if (currentDayOrder < existingDayOrder) {
        existingGroup.representative = session;
      }
    });

    const compressedRows = Array.from(groupedSessions.values()).map((group) => {
      const sessionDays = Array.from(group.days).sort(
        (left, right) => SESSION_DAY_ORDER[left] - SESSION_DAY_ORDER[right],
      );
      const representativeSession = {
        ...group.representative,
        day: sessionDays[0] ?? group.representative.day,
      };
      const sessionHours = toSessionHours(representativeSession);
      const roomLabel = formatRoomLabel(representativeSession);
      const isLecture = representativeSession.type === "Lecture";

      return {
        row_id: `${item.id}:${representativeSession.type}:${representativeSession.start_time}:${representativeSession.end_time}:${roomLabel ?? ""}:${sessionDays.join(",")}`,
        class_id: item.id,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        block_codes_label: mergedBlockCodeLabel,
        student_count: studentCount > 0 ? studentCount : null,
        lecture_hours: isLecture ? sessionHours : null,
        lecture_room: isLecture ? roomLabel : null,
        laboratory_hours: !isLecture ? sessionHours : null,
        laboratory_room: !isLecture ? roomLabel : null,
        session_days: sessionDays,
        session: representativeSession,
      } satisfies FacultyScheduleRow;
    });

    rows.push(...compressedRows);
  });

  return sortScheduleRows(rows);
};

const emptyPageData = (
  terms: ScheduleAcademicTermOption[],
  selectedTerm: ScheduleAcademicTermOption | null,
): FacultySchedulePageData => ({
  terms,
  selected_term_id: selectedTerm?.id ?? null,
  selected_term: selectedTerm,
  has_schedule: false,
  teaching_load_rows: [],
  schedule_rows: [],
  total_teaching_load: 0,
});

export const getFacultyScheduleTermSnapshot = async (
  userId: string,
  academicTermId: string,
): Promise<FacultyScheduleTermSnapshot> => {
  const classRows = await getClassRowsByFacultyAndTerm(userId, academicTermId);

  if (classRows.length === 0) {
    return {
      has_schedule: false,
      teaching_load_rows: [],
      schedule_rows: [],
      total_teaching_load: 0,
    };
  }

  const teachingLoadRows = mapTeachingLoadRows(classRows);
  const scheduleRows = mapScheduleRows(classRows);
  const totalTeachingLoad = teachingLoadRows.reduce(
    (sum, item) => sum + item.load,
    0,
  );

  return {
    has_schedule: true,
    teaching_load_rows: teachingLoadRows,
    schedule_rows: scheduleRows,
    total_teaching_load: totalTeachingLoad,
  };
};

export const getFacultySchedulePageData = async (
  userId: string,
  requestedTermId: string | null,
): Promise<FacultySchedulePageData> => {
  const terms = await getAcademicTerms();
  const selectedTerm = resolveSelectedTerm(terms, requestedTermId);

  if (!selectedTerm) {
    return emptyPageData(terms, null);
  }

  const termSnapshot = await getFacultyScheduleTermSnapshot(
    userId,
    selectedTerm.id,
  );

  return {
    terms,
    selected_term_id: selectedTerm.id,
    selected_term: selectedTerm,
    ...termSnapshot,
  };
};
