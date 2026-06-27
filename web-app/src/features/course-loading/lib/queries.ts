"use server";

import { createClient } from "@/utils/supabase/server";
import { formatFullName } from "@/features/shared/lib/format-name";
import { getUserDataList } from "@/features/profile/lib/user-data/queries";
import type {
  FacultyListItem,
  CourseLoadingSectionListItem,
  FacultyClassRow,
  SectionClassRow,
} from "./types";
import {
  mapSectionClassRow,
  mapCourseLoadingSectionListItem,
  mapFacultyClassRow,
  mapFacultyListItem,
} from "./mappers";

export const getFacultyListByTerm = async (
  termId: string,
  options?: { includeEmpty?: boolean },
): Promise<FacultyListItem[]> => {
  const rows = await getUserDataList({
    academicTermId: termId,
    includeDegrees: true,
    includeClasses: true,
    includeLoads: true,
  });

  if (rows.length === 0) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("user")
      .select(
        `
        id,
        campus_id,
        college_id,
        identity:identity (first_name, middle_name, last_name, suffix, professional_extension),
        campus:campus_id (id, code, name),
        college:college_id (id, code, name)
      `,
      )
      .order("id", { ascending: true });

    if (error) {
      console.error(
        "lib.course-loading.getFacultyListByTerm.fallback ::",
        error,
      );
    } else if (data && data.length > 0) {
      return data.map((row) => {
        const identity = Array.isArray(row.identity)
          ? row.identity[0]
          : row.identity;
        const campus = Array.isArray(row.campus) ? row.campus[0] : row.campus;
        const college = Array.isArray(row.college)
          ? row.college[0]
          : row.college;

        return {
          id: row.id,
          name: formatFullName(identity) || "Unnamed Faculty",
          latest_degree_title: null,
          total_working_load: 0,
          campus_id: row.campus_id ?? null,
          campus_code: campus?.code ?? null,
          campus_name: campus?.name ?? null,
          college_id: row.college_id ?? null,
          college_code: college?.code ?? null,
          college_name: college?.name ?? null,
        };
      });
    }
  }

  const includeEmpty = options?.includeEmpty ?? false;
  const filtered = includeEmpty
    ? rows
    : rows.filter((row) => row.classes.length > 0);
  return filtered.map(mapFacultyListItem);
};

export const getSectionListByTerm = async (
  termId: string,
): Promise<CourseLoadingSectionListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("section")
    .select(
      `
      id,
      code,
      classification,
      year_level,
      student_count,
      major_offering:major_offering_id (
        program_offering:program_offering_id (
          id,
          code,
          campus_id,
          campus:campus_id (id, code, name),
          program:program_id (id, code, name, college_id)
        )
      ),
      course_utilization (
        course:course_id (lecture_unit, laboratory_unit)
      )
    `,
    )
    .eq("academic_term_id", termId)
    .order("code", { ascending: true });

  if (error) {
    console.error("lib.course-loading.getSectionListByTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapCourseLoadingSectionListItem({
      id: row.id,
      code: row.code,
      classification: row.classification,
      year_level: row.year_level,
      student_count: row.student_count,
      major_offering: row.major_offering,
      course_utilization: row.course_utilization,
    }),
  );
};

export const getClassesByFacultyAndTerm = async (
  userId: string,
  termId: string,
): Promise<FacultyClassRow[]> => {
  const supabase = await createClient();

  const { data: userClassRows, error } = await supabase
    .from("user_class")
    .select(
      `
      class:class_id (
        id,
        code,
        course_utilization (
          id,
          course:course_id (id, code, title, lecture_unit, laboratory_unit),
          section:section_id (
            id,
            code,
            classification,
            year_level,
            name,
            student_count,
            major_offering:major_offering_id (
              major:major_id (code),
              program_offering:program_offering_id (
                program:program_id (code),
                campus:campus_id (id, code, name)
              )
            )
          )
        )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("class.course_utilization.section.academic_term_id", termId)
    .order("class_id", { ascending: true });

  if (error) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.classes ::",
      error,
    );
    return [];
  }

  const classRows = (userClassRows ?? []).flatMap((row) => {
    const cls = row.class;
    if (!cls) return [];
    return Array.isArray(cls) ? cls : [cls];
  });

  return classRows.map((cls) =>
    mapFacultyClassRow({
      id: cls.id,
      code: cls.code,
      course_utilization: cls.course_utilization,
    }),
  );
};

export const getClassesBySectionAndTerm = async (
  sectionId: string,
  _termId: string,
): Promise<SectionClassRow[]> => {
  void _termId;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course:course_id (id, code, title, lecture_unit, laboratory_unit),
      class:class_id (
        id,
        code,
        user_class (
          user:user_id (
            id,
            identity:identity (first_name, middle_name, last_name, suffix, professional_extension)
          )
        ),
        session_class (
          session:session_id (type, start_time, end_time)
        ),
        course_utilization (
          section:section_id (id, code, classification)
        )
      )
    `,
    )
    .eq("section_id", sectionId);

  if (error) {
    console.error("lib.course-loading.getClassesBySectionAndTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapSectionClassRow(
      { class: row.class, course: row.course },
      sectionId,
      row.id,
    ),
  );
};
