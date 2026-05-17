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
  if (!input.section_ids || input.section_ids.length === 0) {
    return { error: "At least one section is required" };
  }
  return {};
};

export const ensureCourseUtilizations = async (
  supabase: CourseLoadingSupabase,
  courseId: string,
  sectionIds: string[],
): Promise<Array<{ id: string; section_id: string; class_id: string | null }>> => {
  if (sectionIds.length === 0) return [];

  const { data: existing, error: existingError } = await supabase
    .from("course_utilization")
    .select("id, section_id, class_id")
    .eq("course_id", courseId)
    .in("section_id", sectionIds);

  if (existingError) {
    console.error("lib.course-loading.ensureCourseUtilizations ::", existingError);
    return [];
  }

  const existingSectionIds = new Set((existing ?? []).map((row) => row.section_id));
  const missing = sectionIds.filter((sectionId) => !existingSectionIds.has(sectionId));

  if (missing.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("course_utilization")
      .insert(
        missing.map((sectionId) => ({
          course_id: courseId,
          section_id: sectionId,
        })),
      )
      .select("id, section_id, class_id");

    if (insertError) {
      console.error("lib.course-loading.ensureCourseUtilizations.insert ::", insertError);
      return existing ?? [];
    }

    return [...(existing ?? []), ...(inserted ?? [])];
  }

  return existing ?? [];
};

export const findConflictingSectionAssignments = async (
  supabase: CourseLoadingSupabase,
  courseId: string,
  sectionIds: string[],
  excludedClassId?: string,
): Promise<string[]> => {
  if (sectionIds.length === 0) return [];

  const { data, error } = await supabase
    .from("course_utilization")
    .select("section_id, class_id")
    .eq("course_id", courseId)
    .in("section_id", sectionIds);

  if (error) {
    console.error(
      "lib.course-loading.findConflictingSectionAssignments ::",
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
        .map((row) => row.section_id as string),
    ),
  ];
};

export const diffSectionIds = (
  existing: { id: string; section_id: string }[],
  desiredSectionIds: string[],
): {
  toRemove: { id: string; section_id: string }[];
  toAdd: string[];
} => {
  const existingSectionIds = new Set(existing.map((cb) => cb.section_id));
  const desired = new Set(desiredSectionIds);

  return {
    toRemove: existing.filter((cb) => !desired.has(cb.section_id)),
    toAdd: desiredSectionIds.filter((sectionId) => !existingSectionIds.has(sectionId)),
  };
};
