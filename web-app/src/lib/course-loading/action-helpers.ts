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

export const ensureSchedule = async (
  supabase: CourseLoadingSupabase,
  userId: string,
  academicTermId: string,
): Promise<{ id: string } | null> => {
  const { data: existing } = await supabase
    .from("schedule")
    .select("id")
    .eq("user_id", userId)
    .eq("academic_term_id", academicTermId)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("schedule")
    .insert({ user_id: userId, academic_term_id: academicTermId })
    .select("id")
    .single();

  if (error) {
    console.error("lib.course-loading.ensureSchedule ::", error);
    return null;
  }

  return created;
};

export const getCourseCode = async (
  supabase: CourseLoadingSupabase,
  courseId: string,
): Promise<string> => {
  const { data } = await supabase
    .from("course")
    .select("code")
    .eq("id", courseId)
    .single();

  return data?.code ?? "CLS";
};

export const generateClassCode = async (
  supabase: CourseLoadingSupabase,
  scheduleId: string,
  courseId: string,
  courseCode: string,
): Promise<string> => {
  const { data, error } = await supabase
    .from("class")
    .select("code")
    .eq("schedule_id", scheduleId)
    .eq("course_id", courseId);

  if (error) {
    console.error("lib.course-loading.generateClassCode ::", error);
  }

  const escapedCourseCode = courseCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedCourseCode}-(\\d+)$`);

  const maxSuffix = (data ?? []).reduce((max, row) => {
    const match = pattern.exec(row.code ?? "");
    if (!match) return max;

    const suffix = Number(match[1]);
    if (!Number.isFinite(suffix)) return max;

    return Math.max(max, suffix);
  }, 0);

  return `${courseCode}-${maxSuffix + 1}`;
};

export const findConflictingBlockAssignments = async (
  supabase: CourseLoadingSupabase,
  scheduleId: string,
  courseId: string,
  blockIds: string[],
  excludedClassId?: string,
): Promise<string[]> => {
  if (blockIds.length === 0) return [];

  const { data, error } = await supabase
    .from("class_block")
    .select("block_id, class_id, class:class_id (id, schedule_id, course_id)")
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
          const cls = Array.isArray(row.class) ? row.class[0] : row.class;
          const clsId = (cls as { id?: string })?.id ?? row.class_id;
          const clsScheduleId = (cls as { schedule_id?: string })?.schedule_id;
          const clsCourseId = (cls as { course_id?: string })?.course_id;

          return (
            clsScheduleId === scheduleId &&
            clsCourseId === courseId &&
            clsId !== excludedClassId
          );
        })
        .map((row) => row.block_id),
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
