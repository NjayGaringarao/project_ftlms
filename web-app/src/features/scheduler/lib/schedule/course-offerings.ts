"use server";

import { createClient } from "@/utils/supabase/server";
import type { SessionType } from "@/features/shared/types/models";

export type SchedulerCourseOfferingItem = {
  id: string;
  section_id: string;
  section_code: string;
  student_count: number;
  campus_id: string | null;
  merge_candidate_count: number;
  course_id: string;
  course_code: string;
  course_title: string;
  class_id: string | null;
  class_code: string | null;
  faculty_id: string | null;
  faculty_name: string | null;
  unscheduled_lecture_hours: number;
  unscheduled_laboratory_hours: number;
  merged_sections: Array<{
    id: string;
    code: string;
    classification: "regular" | "irregular";
  }>;
};

type RawUtilizationRow = {
  id: string;
  section_id?: string;
  course_id: string;
  class_id: string | null;
  section?: {
    id?: string | null;
    code?: string | null;
    classification?: "regular" | "irregular" | null;
    student_count?: number | null;
    academic_term_id?: string | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  } | Array<{
    id?: string | null;
    code?: string | null;
    classification?: "regular" | "irregular" | null;
    student_count?: number | null;
    academic_term_id?: string | null;
    major_offering?: {
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    } | Array<{
      program_offering?: { campus_id?: string | null } | Array<{ campus_id?: string | null }>;
    }> | null;
  }> | null;
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
  class?: {
    id?: string | null;
    code?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null } | Array<{ id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null }>;
    }> | null;
    course_utilization?: Array<{
      section?: { id?: string | null; code?: string | null; classification?: "regular" | "irregular" | null } | Array<{ id?: string | null; code?: string | null; classification?: "regular" | "irregular" | null }>;
    }> | null;
    session_class?: Array<{
      session?: {
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      } | Array<{
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      }>;
    }> | null;
  } | Array<{
    id?: string | null;
    code?: string | null;
    user_class?: Array<{
      user?: { id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null } | Array<{ id?: string; identity?: { name?: string | null } | Array<{ name?: string | null }> | null }>;
    }> | null;
    course_utilization?: Array<{
      section?: { id?: string | null; code?: string | null; classification?: "regular" | "irregular" | null } | Array<{ id?: string | null; code?: string | null; classification?: "regular" | "irregular" | null }>;
    }> | null;
    session_class?: Array<{
      session?: {
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      } | Array<{
        type?: SessionType | null;
        start_time?: string | null;
        end_time?: string | null;
      }>;
    }> | null;
  }> | null;
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
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return hour * 60 + minute;
};

const toHours = (minutes: number): number => {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  return minutes / 60;
};

export const getSectionCourseOfferingsForScheduler = async (
  sectionId: string,
): Promise<SchedulerCourseOfferingItem[]> => {
  if (!sectionId?.trim()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      section_id,
      course:course_id(id, code, title, lecture_unit, laboratory_unit),
      section:section_id(
        id,
        code,
        classification,
        student_count,
        academic_term_id,
        major_offering:major_offering_id(
          program_offering:program_offering_id(campus_id)
        )
      ),
      class:class_id(
        id,
        code,
        user_class(
          user:user_id(id, identity:identity(name))
        ),
        course_utilization(
          section:section_id(id, code, classification)
        ),
        session_class(
          session:session_id(type, start_time, end_time)
        )
      )
      `,
    )
    .eq("section_id", sectionId)
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "lib.schedule.course-offerings.getSectionCourseOfferingsForScheduler ::",
      error,
    );
    return [];
  }

  const rows = (data ?? []).map((row) => {
    const raw = row as RawUtilizationRow;
    const course = first(raw.course);
    const section = first(raw.section);
    const majorOffering = first(section?.major_offering);
    const programOffering = first(majorOffering?.program_offering);
    const cls = first(raw.class);
    const userClass = first(cls?.user_class) as { user?: unknown } | null;
    const facultyRow = first(userClass?.user) as
      | { id?: string; identity?: unknown }
      | null;
    const facultyIdentity = first(facultyRow?.identity) as {
      name?: string | null;
    } | null;

    const lectureTarget = Number(course?.lecture_unit ?? 0);
    const laboratoryTarget = Number(course?.laboratory_unit ?? 0) * 3;

    const sessions = (cls?.session_class ?? []).map((sc) => first(sc.session));
    const lectureScheduled = sessions
      .filter((session) => session?.type === "Lecture")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);
    const laboratoryScheduled = sessions
      .filter((session) => session?.type === "Laboratory")
      .reduce((sum, session) => {
        const minutes = toMinutes(session?.end_time) - toMinutes(session?.start_time);
        return sum + toHours(minutes);
      }, 0);

    const mergedSections = (cls?.course_utilization ?? [])
      .map((util) => first(util.section))
      .filter((section): section is {
        id?: string | null;
        code?: string | null;
        classification?: "regular" | "irregular" | null;
      } =>
        Boolean(section?.id),
      )
      .filter((section) => section.id !== sectionId)
      .map((section) => ({
        id: section.id ?? "",
        code: section.code ?? "Unknown",
        classification: section.classification ?? "regular",
      }));

    return {
      id: raw.id,
      section_id: raw.section_id ?? "",
      section_code: section?.code ?? "Unknown",
      student_count: Number(section?.student_count ?? 0),
      campus_id: programOffering?.campus_id ?? null,
      merge_candidate_count: 0,
      course_id: raw.course_id,
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      class_id: raw.class_id ?? null,
      class_code: cls?.code ?? null,
      faculty_id: facultyRow?.id ?? null,
      faculty_name: facultyIdentity?.name ?? null,
      unscheduled_lecture_hours: Math.max(lectureTarget - lectureScheduled, 0),
      unscheduled_laboratory_hours: Math.max(
        laboratoryTarget - laboratoryScheduled,
        0,
      ),
      merged_sections: mergedSections,
    };
  });

  const academicTermId = rows[0]
    ? first((data?.[0] as RawUtilizationRow)?.section)?.academic_term_id ?? null
    : null;
  const courseIds = Array.from(new Set(rows.map((row) => row.course_id)));

  if (academicTermId && courseIds.length > 0) {
    const { data: candidates, error: candidateErr } = await supabase
      .from("course_utilization")
      .select(
        `
        id,
        course_id,
        class_id,
        section:section_id(
          id,
          academic_term_id,
          major_offering:major_offering_id(
            program_offering:program_offering_id(campus_id)
          )
        )
        `,
      )
      .eq("section.academic_term_id", academicTermId)
      .in("course_id", courseIds);

    if (candidateErr) {
      console.error(
        "lib.schedule.course-offerings.getSectionCourseOfferingsForScheduler.candidates ::",
        candidateErr,
      );
      return rows;
    }

    const normalizedCandidates = (candidates ?? []).map((candidate) => {
      const raw = candidate as RawUtilizationRow;
      const section = first(raw.section);
      const majorOffering = first(section?.major_offering);
      const programOffering = first(majorOffering?.program_offering);
      return {
        id: raw.id,
        course_id: raw.course_id,
        class_id: raw.class_id ?? null,
        campus_id: programOffering?.campus_id ?? null,
      };
    });

    return rows.map((row) => {
      const count = normalizedCandidates.filter((candidate) => {
        if (candidate.id === row.id) return false;
        if (!candidate.class_id || !row.class_id) return false;
        if (candidate.class_id === row.class_id) return false;
        if (candidate.course_id !== row.course_id) return false;
        if (candidate.campus_id !== row.campus_id) return false;
        return true;
      }).length;

      return { ...row, merge_candidate_count: count };
    });
  }

  return rows;
};
