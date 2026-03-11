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

type ClassDeliveryBlockRow = {
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

type ClassDeliverySessionRow = {
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

type ClassDeliveryRow = {
  id: string;
  course_allocation?: {
    course_offering?: {
      course?: {
        code?: string | null;
        title?: string | null;
        lecture_hour?: number | null;
        laboratory_hour?: number | null;
      } | null;
    } | null;
  } | null;
  class_delivery_block?: ClassDeliveryBlockRow[] | null;
  session?: ClassDeliverySessionRow[] | null;
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

const getScheduleIdByFacultyAndTerm = async (
  userId: string,
  academicTermId: string,
): Promise<string | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", academicTermId)
    .maybeSingle();

  if (error) {
    console.error("lib.schedule.getScheduleIdByFacultyAndTerm ::", error);
    return null;
  }

  return data?.id ?? null;
};

const formatBlockLabel = (
  yearLevel: number | null | undefined,
  section: string | null | undefined,
): string | null => {
  if (!yearLevel || !section) return null;
  return `${yearLevel}${section}`;
};

const mapSession = (
  session: ClassDeliverySessionRow,
): FacultyScheduleSessionInfo => {
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

const getClassDeliveries = async (
  scheduleId: string,
): Promise<ClassDeliveryRow[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("class_delivery")
    .select(
      `
      id,
      course_allocation:course_allocation!inner(
        schedule_id,
        course_offering:course_offering!inner(
          course:course!inner(code, title, lecture_hour, laboratory_hour)
        )
      ),
      class_delivery_block(
        block:block(
          year_level,
          section,
          major_offering:major_offering!inner(
            program_offering:program_offering!inner(
              campus:campus!inner(name)
            )
          )
        )
      ),
      session:session!session_class_delivery_id_fkey(
        id,
        day,
        start_time,
        end_time,
        type,
        room:room(code, name)
      )
    `,
    )
    .eq("course_allocation.schedule_id", scheduleId);

  if (error) {
    console.error("lib.schedule.getClassDeliveries ::", error);
    return [];
  }

  return (data ?? []) as ClassDeliveryRow[];
};

const mapTeachingLoadRows = (
  classDeliveries: ClassDeliveryRow[],
): FacultyTeachingLoadRow[] => {
  return classDeliveries.map((item) => {
    const course = item.course_allocation?.course_offering?.course;
    const lectureHour = Number(course?.lecture_hour ?? 0);
    const laboratoryHour = Number(course?.laboratory_hour ?? 0);

    const blocks = (item.class_delivery_block ?? [])
      .map((entry) =>
        formatBlockLabel(
          entry.block?.year_level ?? null,
          entry.block?.section ?? null,
        ),
      )
      .filter((value): value is string => Boolean(value));

    const campusLabel = Array.from(
      new Set(
        (item.class_delivery_block ?? [])
          .map(
            (entry) =>
              entry.block?.major_offering?.program_offering?.campus?.name ??
              null,
          )
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

const mapScheduleRows = (
  classDeliveries: ClassDeliveryRow[],
): FacultyScheduleRow[] => {
  const rows: FacultyScheduleRow[] = [];

  classDeliveries.forEach((item) => {
    const course = item.course_allocation?.course_offering?.course;
    const blocks = (item.class_delivery_block ?? [])
      .map((entry) =>
        formatBlockLabel(
          entry.block?.year_level ?? null,
          entry.block?.section ?? null,
        ),
      )
      .filter((value): value is string => Boolean(value));

    const mergedBlockLabel = mergeBlockLabels(blocks);
    const sessions = (item.session ?? []).map(mapSession);

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

  const scheduleId = await getScheduleIdByFacultyAndTerm(
    userId,
    selectedTerm.id,
  );
  if (!scheduleId) {
    return emptyPageData(terms, selectedTerm);
  }

  const classDeliveries = await getClassDeliveries(scheduleId);
  const teachingLoadRows = mapTeachingLoadRows(classDeliveries);
  const scheduleRows = mapScheduleRows(classDeliveries);
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
