import { createClient } from "@/utils/supabase/server";
import type { ClassInsertInput } from "./types";

type CourseLoadingSupabase = Awaited<ReturnType<typeof createClient>>;

export const validateClassInsertInput = (
  input: ClassInsertInput,
): { error?: string } => {
  if (!input.faculty_id?.trim()) return { error: "Faculty is required" };
  if (!input.course_id?.trim()) return { error: "Course is required" };
  if (!input.academic_term_id?.trim()) {
    return { error: "Academic term is required" };
  }
  if (!input.block_ids || input.block_ids.length === 0) {
    return { error: "At least one block is required" };
  }
  return {};
};

export const ensureCourseUtilizations = async (
  supabase: CourseLoadingSupabase,
  courseId: string,
  blockIds: string[],
): Promise<Array<{ id: string; block_id: string; class_id: string | null }>> => {
  if (blockIds.length === 0) return [];

  const { data: existing, error: existingError } = await supabase
    .from("course_utilization")
    .select("id, block_id, class_id")
    .eq("course_id", courseId)
    .in("block_id", blockIds);

  if (existingError) {
    console.error("lib.course-loading.ensureCourseUtilizations ::", existingError);
    return [];
  }

  const existingBlockIds = new Set((existing ?? []).map((row) => row.block_id));
  const missing = blockIds.filter((blockId) => !existingBlockIds.has(blockId));

  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("course_utilization")
      .insert(
        missing.map((blockId) => ({
          course_id: courseId,
          block_id: blockId,
        })),
      )
      .select("id, block_id, class_id");

    if (insertError) {
      console.error("lib.course-loading.ensureCourseUtilizations.insert ::", insertError);
      return existing ?? [];
    }

    return [...(existing ?? []), ...(inserted ?? [])];
  }

  return existing ?? [];
};

export const findConflictingBlockAssignments = async (
  supabase: CourseLoadingSupabase,
  courseId: string,
  blockIds: string[],
  excludedClassId?: string,
): Promise<string[]> => {
  if (blockIds.length === 0) return [];

  const { data, error } = await supabase
    .from("course_utilization")
    .select("block_id, class_id")
    .eq("course_id", courseId)
    .in("block_id", blockIds);

  if (error) {
    console.error(
      "lib.course-loading.findConflictingBlockAssignments ::",
      error,
    );
    return [];
  }

  return [
    ...new Set(
      (data ?? [])
        .filter((row) => {
          if (!row.class_id) return false;
          if (excludedClassId && row.class_id === excludedClassId) return false;
          return true;
        })
        .map((row) => row.block_id as string),
    ),
  ];
};

export const diffBlockIds = (
  existing: { id: string; block_id: string }[],
  desiredBlockIds: string[],
): {
  toRemove: { id: string; block_id: string }[];
  toAdd: string[];
} => {
  const existingBlockIds = new Set(existing.map((cb) => cb.block_id));
  const desired = new Set(desiredBlockIds);

  return {
    toRemove: existing.filter((cb) => !desired.has(cb.block_id)),
    toAdd: desiredBlockIds.filter((blockId) => !existingBlockIds.has(blockId)),
  };
};
