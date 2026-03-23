"use server";

import { createClient } from "@/utils/supabase/server";
import { SessionDay, SessionType } from "@/models";
import {
  FacultySchedulePageData,
  FacultyScheduleRow,
  FacultyScheduleSessionInfo,
  FacultyTeachingLoadRow,
  ScheduleAcademicTermOption,
} from "./types";
import {
  computeTeachingLoad,
  mergeBlockLabels,
  sortScheduleRows,
} from "./utils";

type ClassBlockRow = {
  block?: {
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
    const blocks = (item.course_utilization ?? [])
      .map((entry) => first(entry.block))
      .filter(Boolean)
      .map((block) =>
        formatBlockLabel(block?.year_level ?? null, block?.section ?? null),
      )
      .filter((value): value is string => Boolean(value));

    const mergedBlockLabel = mergeBlockLabels(blocks);
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
        merged_block_label: mergedBlockLabel,
        session: null,
      });
      return;
    }

    sessions.forEach((session) => {
      rows.push({
        row_id: `${item.id}:${session.id}`,
        class_id: item.id,
        course_code: course?.code ?? "Unknown",
        course_title: course?.title ?? "Untitled Course",
        merged_block_label: mergedBlockLabel,
        session,
      });
    });
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

export const getFacultySchedulePageData = async (
  userId: string,
  requestedTermId: string | null,
): Promise<FacultySchedulePageData> => {
  const terms = await getAcademicTerms();
  const selectedTerm = resolveSelectedTerm(terms, requestedTermId);

  if (!selectedTerm) {
    return emptyPageData(terms, null);
  }

  const classRows = await getClassRowsByFacultyAndTerm(
    userId,
    selectedTerm.id,
  );

  if (classRows.length === 0) {
    return emptyPageData(terms, selectedTerm);
  }

  const teachingLoadRows = mapTeachingLoadRows(classRows);
  const scheduleRows = mapScheduleRows(classRows);
  const totalTeachingLoad = teachingLoadRows.reduce(
    (sum, item) => sum + item.load,
    0,
  );

  return {
    terms,
    selected_term_id: selectedTerm.id,
    selected_term: selectedTerm,
    has_schedule: true,
    teaching_load_rows: teachingLoadRows,
    schedule_rows: scheduleRows,
    total_teaching_load: totalTeachingLoad,
  };
};
