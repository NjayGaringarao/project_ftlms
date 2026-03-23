"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  FacultyListItem,
  CourseLoadingBlockListItem,
  FacultyClassRow,
  BlockClassRow,
} from "./types";
import {
  mapBlockClassRow,
  mapCourseLoadingBlockListItem,
  mapFacultyClassRow,
  mapFacultyListItem,
} from "./mappers";

export const getFacultyListByTerm = async (
  termId: string,
): Promise<FacultyListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user")
    .select(
      `
      id,
      identity:identity (name),
      degree:degree (title, academic_level, year_graduated),
      designation (load),
      campus:campus_id (id, code, name),
      college:college_id (id, code, name),
      user_class (
        class:class_id (
          id,
          course_utilization (
            course:course_id (lecture_unit, laboratory_unit),
            block:block_id (academic_term_id)
          )
        )
      )
    `,
    )
    .eq("user_class.class.course_utilization.block.academic_term_id", termId)
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.course-loading.getFacultyListByTerm ::", error);
    return [];
  }

  if (!data) return [];

  return data.map((row) =>
    mapFacultyListItem({
      id: row.id,
      identity: row.identity,
      degree: row.degree,
      designation: row.designation,
      campus: row.campus,
      college: row.college,
      user_class: row.user_class,
    }),
  );
};

export const getBlockListByTerm = async (
  termId: string,
): Promise<CourseLoadingBlockListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("block")
    .select(
      `
      id,
      code,
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
    console.error("lib.course-loading.getBlockListByTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapCourseLoadingBlockListItem({
      id: row.id,
      code: row.code,
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
          block:block_id (
            id,
            code,
            year_level,
            section,
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
    .eq("class.course_utilization.block.academic_term_id", termId)
    .order("class_id", { ascending: true });

  if (error) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.classes ::",
      error,
    );
    return [];
  }

  return (userClassRows ?? [])
    .map((row) => row.class)
    .filter(Boolean)
    .map((cls) =>
      mapFacultyClassRow({
        id: cls.id,
        code: cls.code,
        course_utilization: cls.course_utilization,
      }),
    );
};

export const getClassesByBlockAndTerm = async (
  blockId: string,
  _termId: string,
): Promise<BlockClassRow[]> => {
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
            identity:identity (name)
          )
        ),
        course_utilization (
          block:block_id (id, code)
        )
      )
    `,
    )
    .eq("block_id", blockId);

  if (error) {
    console.error("lib.course-loading.getClassesByBlockAndTerm ::", error);
    return [];
  }

  return (data ?? []).map((row) =>
    mapBlockClassRow(
      { class: row.class, course: row.course },
      blockId,
    ),
  );
};
