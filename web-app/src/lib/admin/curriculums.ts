"use server";

import { ExtendedCurriculum } from "@/models";
import { createClient } from "@/utils/supabase/server";
import { CourseListItem } from "./courses";
import { TermListItem } from "./terms";

export type CurriculumListItem = ExtendedCurriculum & {
  major: ExtendedCurriculum["major"] & {
    program: {
      id: string;
      department_id: string;
      code: string;
      name: string;
      description: string | null;
      department: {
        id: string;
        code: string;
        name: string;
        type:
          | "ACADEMIC"
          | "ADMINISTRATIVE"
          | "STUDENT_SERVICES"
          | "EXTENSION_SERVICES";
        description: string | null;
      } | null;
    } | null;
  };
};

export type CurriculumTermCourseLink = {
  id: string;
  academic_term_id: string;
  term: TermListItem;
  courses: Array<{
    id: string;
    course_id: string;
    course: CourseListItem;
  }>;
};

const TERM_ORDER_LABELS: Record<string, number> = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
};

const normalizeCurriculumRow = (item: unknown): CurriculumListItem => {
  const row = item as CurriculumListItem & {
    major:
      | CurriculumListItem["major"]
      | Array<CurriculumListItem["major"]>
      | null;
  };

  const major = Array.isArray(row.major) ? row.major[0] : row.major;

  if (!major) {
    return row as CurriculumListItem;
  }

  const programValue = major.program as
    | CurriculumListItem["major"]["program"]
    | Array<CurriculumListItem["major"]["program"]>
    | undefined;
  const program = Array.isArray(programValue) ? programValue[0] : programValue;

  return {
    ...row,
    major: {
      ...major,
      program: program
        ? {
            ...program,
            department: Array.isArray(program.department)
              ? program.department[0]
              : program.department,
          }
        : null,
    },
  } as CurriculumListItem;
};

export const getCurriculumsByMajor = async (
  majorId: string,
): Promise<CurriculumListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .eq("major_id", majorId)
    .order("series_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumsByMajor ::", error);
    return [];
  }

  return (data ?? []).map(normalizeCurriculumRow);
};

export const getCurriculumsList = async (): Promise<CurriculumListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .order("series_year", { ascending: false })
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumsList ::", error);
    return [];
  }

  return (data ?? []).map(normalizeCurriculumRow);
};

export const getCurriculumById = async (
  curriculumId: string,
): Promise<CurriculumListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum")
    .select(
      `
      id,
      major_id,
      title,
      series_year,
      revised_year,
      major:major_id (
        id,
        program_id,
        code,
        name,
        description,
        program:program_id (
          id,
          department_id,
          code,
          name,
          description,
          department:department_id (id, code, name, type, description)
        )
      )
      `,
    )
    .eq("id", curriculumId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.curriculums.getCurriculumById ::", error);
    return null;
  }

  if (!data) return null;
  return normalizeCurriculumRow(data);
};

export const getCurriculumTermCourseLinks = async (
  curriculumId: string,
): Promise<CurriculumTermCourseLink[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("curriculum_offering")
    .select(
      `
      id,
      academic_term_id,
      term:academic_term_id (
        id,
        academic_year_start,
        academic_year_end,
        code,
        term_order,
        type,
        start,
        end
      ),
      courses:course_offering (
        id,
        course_id,
        course:course_id (
          id,
          code,
          title,
          lecture_hour,
          laboratory_hour
        )
      )
      `,
    )
    .eq("curriculum_id", curriculumId);

  if (error) {
    console.error(
      "lib.admin.curriculums.getCurriculumTermCourseLinks ::",
      error,
    );
    return [];
  }

  return (data ?? [])
    .map((item) => {
      const rawTerm = Array.isArray(item.term) ? item.term[0] : item.term;
      const rawCourses = Array.isArray(item.courses) ? item.courses : [];

      return {
        id: item.id,
        academic_term_id: item.academic_term_id,
        term: rawTerm as TermListItem,
        courses: rawCourses
          .map((entry) => ({
            id: entry.id,
            course_id: entry.course_id,
            course: Array.isArray(entry.course)
              ? entry.course[0]
              : entry.course,
          }))
          .filter((entry) => Boolean(entry.course?.id))
          .sort((a, b) => {
            const codeA = a.course.code?.toLowerCase() ?? "";
            const codeB = b.course.code?.toLowerCase() ?? "";
            return codeA.localeCompare(codeB);
          }),
      } as CurriculumTermCourseLink;
    })
    .filter((item) => Boolean(item.term?.id))
    .sort((a, b) => {
      const yearCompare =
        b.term.academic_year_start - a.term.academic_year_start;
      if (yearCompare !== 0) return yearCompare;

      const typeCompare = a.term.type.localeCompare(b.term.type);
      if (typeCompare !== 0) return typeCompare;

      return (
        (TERM_ORDER_LABELS[a.term.term_order] ?? 99) -
        (TERM_ORDER_LABELS[b.term.term_order] ?? 99)
      );
    });
};
