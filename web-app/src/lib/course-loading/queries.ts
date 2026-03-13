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

// ─── Faculty sidebar list ───────────────────────────────

export const getFacultyListByTerm = async (
  termId: string,
): Promise<FacultyListItem[]> => {
  const supabase = await createClient();

  // List ALL users; nest schedule filtered by term so ATL is term-specific.
  // PostgREST returns users even when the nested schedule array is empty.
  const { data, error } = await supabase
    .from("user")
    .select(
      `
      id,
      identity:identity (name),
      degree:degree (title, academic_level, year_graduated),
      designation (load),
      schedule (
        id,
        class (
          id,
          course:course_id (lecture_unit, laboratory_unit)
        )
      )
    `,
    )
    .eq("schedule.academic_term_id", termId)
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
      schedule: row.schedule,
    }),
  );
};

// ─── Block sidebar list ─────────────────────────────────

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
          campus:campus_id (id, code, name)
        )
      ),
      class_block (
        class:class_id (
          course:course_id (lecture_unit, laboratory_unit)
        )
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
      class_block: row.class_block,
    }),
  );
};

// ─── Faculty-aware class table ──────────────────────────

export const getClassesByFacultyAndTerm = async (
  userId: string,
  termId: string,
): Promise<FacultyClassRow[]> => {
  const supabase = await createClient();

  // Find the schedule for this user+term
  const { data: schedule, error: scheduleError } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", termId)
    .maybeSingle();

  if (scheduleError) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.schedule ::",
      scheduleError,
    );
    return [];
  }

  if (!schedule) return [];

  // Get all classes under this schedule
  const { data: classes, error: classError } = await supabase
    .from("class")
    .select(
      `
      id,
      code,
      course:course_id (id, code, title, lecture_unit, laboratory_unit),
      class_block (
        id,
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
    `,
    )
    .eq("schedule_id", schedule.id)
    .order("created_at", { ascending: true });

  if (classError) {
    console.error(
      "lib.course-loading.getClassesByFacultyAndTerm.classes ::",
      classError,
    );
    return [];
  }

  return (classes ?? []).map((cls) =>
    mapFacultyClassRow({
      id: cls.id,
      code: cls.code,
      course: cls.course,
      class_block: cls.class_block,
    }),
  );
};

// ─── Block-aware class table ────────────────────────────

export const getClassesByBlockAndTerm = async (
  blockId: string,
  _termId: string,
): Promise<BlockClassRow[]> => {
  const supabase = await createClient();

  // Get class_blocks for this block
  const { data, error } = await supabase
    .from("class_block")
    .select(
      `
      id,
      class:class_id (
        id,
        code,
        course:course_id (id, code, title, lecture_unit, laboratory_unit),
        schedule:schedule_id (
          user:user_id (
            id,
            identity:identity (name)
          )
        ),
        class_block (
          id,
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
    mapBlockClassRow({ class: row.class }, blockId),
  );
};
