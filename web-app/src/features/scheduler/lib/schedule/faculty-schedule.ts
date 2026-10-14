"use server";

import { getDefaultAcademicTermCached } from "@/features/admin/lib/terms-cached";
import { createClient } from "@/utils/supabase/server";
import {
  SessionDay,
  SessionType,
  normalizeCampusCollegeLoadSnapshot,
} from "@/features/shared/types/models";
import type {
  CampusCollegeLoadSnapshotClass,
  CampusCollegeLoadSnapshotFaculty,
  CampusCollegeLoadSnapshotSession,
} from "@/features/shared/types/models";
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
  sortScheduleRows,
  toMinutes,
} from "./utils";
import { formatMergedSectionLabels } from "@/features/course-loading/lib/formatters";

type ClassSectionRow = {
  section?: {
    id?: string | null;
    code?: string | null;
    classification?: "regular" | "irregular" | null;
    student_count?: number | null;
    year_level?: number | null;
    name?: string | null;
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
  room_id?: string | null;
  room?: {
    code?: string | null;
    name?: string | null;
  } | null;
};

type ClassRow = {
  id: string;
  code: string;
  course_utilization?: Array<{
    id?: string | null;
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
    section?: ClassSectionRow["section"] | Array<ClassSectionRow["section"]> | null;
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
  defaultTermId: string | null,
): ScheduleAcademicTermOption | null => {
  if (terms.length === 0) return null;

  if (requestedTermId) {
    const matched = terms.find((term) => term.id === requestedTermId);
    if (matched) return matched;
  }

  const configuredDefaultTerm = terms.find(
    (term) => term.id === defaultTermId,
  );
  if (configuredDefaultTerm) return configuredDefaultTerm;

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
      class:class_id!inner(
        id,
        code,
        course_utilization!inner(
          id,
          course:course_id(code, title, lecture_unit, laboratory_unit),
          section:section_id!inner(
            id,
            code,
            classification,
            student_count,
            year_level,
            name,
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
            room_id,
            room:room_id(code, name)
          )
        )
      )
      `,
    )
    .eq("user_id", userId)
    .eq("class.course_utilization.section.academic_term_id", academicTermId);

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

const formatSectionLabel = (
  yearLevel: number | null | undefined,
  name: string | null | undefined,
): string | null => {
  if (!yearLevel || !name) return null;
  return `${yearLevel}${name}`;
};

const mapSession = (session: ClassSessionRow): FacultyScheduleSessionInfo => {
  return {
    id: session.id,
    day: session.day,
    start_time: session.start_time,
    end_time: session.end_time,
    type: session.type,
    room_id: session.room_id ?? null,
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

    const sections = (item.course_utilization ?? [])
      .map((entry) => first(entry.section))
      .filter(Boolean)
      .map((section) =>
        formatSectionLabel(section?.year_level ?? null, section?.name ?? null),
      )
      .filter((value): value is string => Boolean(value));
    const sectionLabelRows = (item.course_utilization ?? [])
      .map((entry) => first(entry.section))
      .filter((section): section is NonNullable<typeof section> => Boolean(section))
      .map((section) => ({
        label: formatSectionLabel(section.year_level ?? null, section.name ?? null),
        classification: section.classification ?? "regular",
      }))
      .filter((section): section is {
        label: string;
        classification: "regular" | "irregular";
      } => Boolean(section.label));

    const campusLabel = Array.from(
      new Set(
        (item.course_utilization ?? [])
          .map((entry) => {
            const section = first(entry.section);
            const majorOffering = first(section?.major_offering);
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
      sections,
      merged_section_label: formatMergedSectionLabels(
        sectionLabelRows,
        (section) => section.label,
      ),
      campus_label: campusLabel || "Not assigned",
    };
  });
};

const mapScheduleRows = (classRows: ClassRow[]): FacultyScheduleRow[] => {
  const rows: FacultyScheduleRow[] = [];

  classRows.forEach((item) => {
    const firstUtil = (item.course_utilization ?? [])[0];
    const primarySection = first(firstUtil?.section);
    const primarySectionId = primarySection?.id ?? null;
    const primaryCourseUtilizationId = firstUtil?.id ?? null;
    const course = first(firstUtil?.course);
    const sectionRows = (item.course_utilization ?? [])
      .map((entry) => first(entry.section))
      .filter((section): section is NonNullable<typeof section> => Boolean(section));

    const sectionCodes = Array.from(
      new Map(
        sectionRows
          .map((section) => ({
            code: section.code?.trim() ?? "",
            classification: section.classification ?? "regular",
          }))
          .filter((section) => Boolean(section.code))
          .map((section) => [section.code, section]),
      ).values(),
    );

    const seenSectionIds = new Set<string>();
    const uniqueSectionRows = sectionRows.filter((section) => {
      const dedupeKey = section.id?.trim() || section.code?.trim() || "";
      if (!dedupeKey) return true;
      if (seenSectionIds.has(dedupeKey)) return false;
      seenSectionIds.add(dedupeKey);
      return true;
    });

    const studentCount = uniqueSectionRows.reduce(
      (sum, section) => sum + Number(section.student_count ?? 0),
      0,
    );
    const mergedSectionCodeLabel = formatMergedSectionLabels(
      sectionCodes,
      (section) => section.code,
    );
    const sessions = (item.session_class ?? [])
      .map((entry) => first(entry.session))
      .filter((session): session is ClassSessionRow => Boolean(session))
      .map(mapSession);

    if (sessions.length === 0) {
      rows.push({
        row_id: `${item.id}:no-session`,
        class_id: item.id,
        primary_section_id: primarySectionId,
        primary_course_utilization_id: primaryCourseUtilizationId,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        section_codes_label: mergedSectionCodeLabel,
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
      const roomMergeKey = session.room_id
        ? `id:${session.room_id}`
        : `label:${session.room_code ?? ""}:${session.room_name ?? ""}`;
      const sessionGroupKey = [
        session.type,
        session.start_time,
        session.end_time,
        roomMergeKey,
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
      const sessionHours = Number(
        (toSessionHours(representativeSession) * sessionDays.length).toFixed(2),
      );
      const roomLabel = formatRoomLabel(representativeSession);
      const isLecture = representativeSession.type === "Lecture";

      return {
        row_id: `${item.id}:${representativeSession.type}:${representativeSession.start_time}:${representativeSession.end_time}:${roomLabel ?? ""}:${sessionDays.join(",")}`,
        class_id: item.id,
        primary_section_id: primarySectionId,
        primary_course_utilization_id: primaryCourseUtilizationId,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        section_codes_label: mergedSectionCodeLabel,
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

const toSessionDay = (day: string): SessionDay =>
  (day.slice(0, 1).toUpperCase() + day.slice(1).toLowerCase()) as SessionDay;

type FacultySnapshotResult = {
  faculty: CampusCollegeLoadSnapshotFaculty;
  classMap: Map<string, CampusCollegeLoadSnapshotClass>;
};

const getFacultySnapshotData = async (
  userId: string,
  academicTermId: string,
): Promise<FacultySnapshotResult | null> => {
  const supabase = await createClient();

  const { data: loads } = await supabase
    .from("campus_college_load")
    .select("id")
    .eq("academic_term_id", academicTermId);

  if (!loads?.length) return null;

  // Two batched queries instead of one latest-revision query per load.
  // Stage A: light metadata only (no snapshot JSON); loads-per-term is small,
  // so the PostgREST row cap is not a concern.
  const { data: revisionMeta } = await supabase
    .from("campus_college_load_revision")
    .select("id, campus_college_load_id, revision_number")
    .in(
      "campus_college_load_id",
      loads.map((load) => load.id),
    );

  const latestByLoad = new Map<string, { id: string; revisionNumber: number }>();
  for (const meta of revisionMeta ?? []) {
    const loadId = String(meta.campus_college_load_id);
    const revisionNumber = Number(meta.revision_number ?? 0);
    const current = latestByLoad.get(loadId);
    if (!current || revisionNumber > current.revisionNumber) {
      latestByLoad.set(loadId, { id: String(meta.id), revisionNumber });
    }
  }

  if (latestByLoad.size === 0) return null;

  // Stage B: snapshots for the latest revisions only.
  const { data: revisions } = await supabase
    .from("campus_college_load_revision")
    .select("id, snapshot")
    .in(
      "id",
      Array.from(latestByLoad.values()).map((revision) => revision.id),
    );

  for (const revision of revisions ?? []) {
    if (!revision) continue;
    const normalized = normalizeCampusCollegeLoadSnapshot(revision.snapshot);
    if (!normalized) continue;
    const faculty = normalized.faculty_load.faculty.find(
      (f) => f.faculty_id === userId,
    );
    if (faculty) {
      const classMap = new Map(
        normalized.class_schedule.classes.map((c) => [c.class_id, c]),
      );
      return { faculty, classMap };
    }
  }

  return null;
};

const mapSnapshotToScheduleRows = (
  faculty: CampusCollegeLoadSnapshotFaculty,
  classMap: Map<string, CampusCollegeLoadSnapshotClass>,
): FacultyScheduleRow[] => {
  const rows: FacultyScheduleRow[] = [];

  for (const cls of faculty.classes) {
    // Older snapshots don't embed sessions on the faculty class; fall back to
    // the class_schedule classMap (same pattern as FacultyTeachingLoadPage).
    const sessions: CampusCollegeLoadSnapshotSession[] =
      cls.sessions !== undefined ? cls.sessions : (classMap.get(cls.id)?.sessions ?? []);

    if (sessions.length === 0) {
      rows.push({
        row_id: `${cls.id}:no-session`,
        class_id: cls.id,
        primary_section_id: null,
        primary_course_utilization_id: null,
        course_code: cls.course_code,
        course_title: cls.course_title,
        section_codes_label: cls.section_code,
        student_count: cls.student_count > 0 ? cls.student_count : null,
        lecture_hours: null,
        lecture_room: null,
        laboratory_hours: null,
        laboratory_room: null,
        session_days: [],
        session: null,
      });
      continue;
    }

    const groups = new Map<
      string,
      { representative: CampusCollegeLoadSnapshotSession; days: Set<SessionDay> }
    >();

    for (const session of sessions) {
      const groupKey = `${session.type}|${session.start_time}|${session.end_time}|${session.room_code ?? ""}`;
      const existing = groups.get(groupKey);
      const day = toSessionDay(session.day);
      if (!existing) {
        groups.set(groupKey, { representative: session, days: new Set([day]) });
      } else {
        existing.days.add(day);
      }
    }

    for (const group of groups.values()) {
      const { representative } = group;
      const sessionDays = Array.from(group.days).sort(
        (a, b) => (SESSION_DAY_ORDER[a] ?? 999) - (SESSION_DAY_ORDER[b] ?? 999),
      );
      const durationMinutes =
        toMinutes(representative.end_time) - toMinutes(representative.start_time);
      const durationHours = durationMinutes > 0 ? durationMinutes / 60 : 0;
      const totalHours = Number((durationHours * sessionDays.length).toFixed(2));
      const isLecture = representative.type?.toLowerCase() !== "laboratory";
      const representativeDay = toSessionDay(representative.day);

      const representativeSession: FacultyScheduleSessionInfo = {
        id: `snap:${cls.id}:${representative.type}:${representative.start_time}`,
        day: representativeDay,
        start_time: representative.start_time,
        end_time: representative.end_time,
        type: representative.type as SessionType,
        room_id: null,
        room_code: representative.room_code,
        room_name: representative.room_name,
      };

      rows.push({
        row_id: `${cls.id}:${representative.type}:${representative.start_time}:${representative.end_time}:${sessionDays.join(",")}`,
        class_id: cls.id,
        primary_section_id: null,
        primary_course_utilization_id: null,
        course_code: cls.course_code,
        course_title: cls.course_title,
        section_codes_label: cls.section_code,
        student_count: cls.student_count > 0 ? cls.student_count : null,
        lecture_hours: isLecture ? totalHours : null,
        lecture_room: isLecture ? representative.room_code : null,
        laboratory_hours: !isLecture ? totalHours : null,
        laboratory_room: !isLecture ? representative.room_code : null,
        session_days: sessionDays,
        session: representativeSession,
      });
    }
  }

  return sortScheduleRows(rows);
};

const mapSnapshotToTeachingLoadRows = (
  faculty: CampusCollegeLoadSnapshotFaculty,
): FacultyTeachingLoadRow[] =>
  faculty.classes.map((cls) => ({
    class_id: cls.id,
    course_code: cls.course_code,
    course_title: cls.course_title,
    lecture_hour: cls.lecture_unit,
    laboratory_hour: cls.laboratory_unit,
    load: computeTeachingLoad(cls.lecture_unit, cls.laboratory_unit),
    sections: [cls.section_code],
    merged_section_label: cls.section_code,
    campus_label: faculty.campus_code ?? "Not assigned",
  }));

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
  ftl_available: false,
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
  // Speculatively fetch the requested term's snapshot while the term list
  // loads; the result is discarded if the requested id turns out invalid.
  const speculativeSnapshotPromise = requestedTermId
    ? getFacultySnapshotData(userId, requestedTermId)
    : null;
  const [terms, defaultTerm] = await Promise.all([
    getAcademicTerms(),
    getDefaultAcademicTermCached(),
  ]);
  const selectedTerm = resolveSelectedTerm(
    terms,
    requestedTermId,
    defaultTerm?.id ?? null,
  );

  if (!selectedTerm) {
    return emptyPageData(terms, null);
  }

  // Prefer snapshot data so the UI reflects exactly what will be exported.
  const snapshotFaculty =
    speculativeSnapshotPromise && selectedTerm.id === requestedTermId
      ? await speculativeSnapshotPromise
      : await getFacultySnapshotData(userId, selectedTerm.id);

  if (snapshotFaculty) {
    const { faculty, classMap } = snapshotFaculty;
    const teachingLoadRows = mapSnapshotToTeachingLoadRows(faculty);
    const scheduleRows = mapSnapshotToScheduleRows(faculty, classMap);
    const totalTeachingLoad = teachingLoadRows.reduce(
      (sum, row) => sum + row.load,
      0,
    );
    return {
      terms,
      selected_term_id: selectedTerm.id,
      selected_term: selectedTerm,
      has_schedule: faculty.classes.length > 0,
      teaching_load_rows: teachingLoadRows,
      schedule_rows: scheduleRows,
      total_teaching_load: totalTeachingLoad,
      ftl_available: true,
    };
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
    ftl_available: false,
  };
};
