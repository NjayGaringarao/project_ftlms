"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type BlockCourseRow = {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  class_id: string | null;
  class_code: string | null;
};

export const getBlockCourses = async (
  blockId: string,
): Promise<BlockCourseRow[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_utilization")
    .select(
      `
      id,
      course_id,
      class_id,
      course:course_id(code, title),
      class:class_id(code)
      `,
    )
    .eq("block_id", blockId)
    .order("id", { ascending: true });

  if (error) {
    console.error("lib.blocks.course-planner.getBlockCourses ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const course = Array.isArray(row.course) ? row.course[0] : row.course;
    const cls = Array.isArray(row.class) ? row.class[0] : row.class;

    return {
      id: row.id,
      course_id: row.course_id,
      course_code: course?.code ?? "Unknown",
      course_title: course?.title ?? "Untitled Course",
      class_id: row.class_id ?? null,
      class_code: cls?.code ?? null,
    };
  });
};

export const addCourseToBlock = async (
  blockId: string,
  courseId: string,
  academicTermId?: string | null,
): Promise<{ data?: boolean; error?: string }> => {
  if (!blockId?.trim()) return { error: "Block is required" };
  if (!courseId?.trim()) return { error: "Course is required" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_utilization")
    .insert({ block_id: blockId, course_id: courseId });

  if (error) {
    return { error: error.message };
  }

  if (academicTermId) {
    revalidatePath("/blocks");
  } else {
    revalidatePath("/blocks");
  }
  return { data: true };
};

export const removeCourseFromBlock = async (
  blockId: string,
  courseId: string,
  academicTermId?: string | null,
): Promise<{ data?: boolean; error?: string }> => {
  if (!blockId?.trim()) return { error: "Block is required" };
  if (!courseId?.trim()) return { error: "Course is required" };

  const supabase = await createClient();
  const { data: utilization, error: fetchError } = await supabase
    .from("course_utilization")
    .select("id, class_id")
    .eq("block_id", blockId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError.message };
  }

  if (!utilization) {
    return { error: "Course utilization not found." };
  }

  if (utilization.class_id) {
    const { count, error: sessionError } = await supabase
      .from("session_class")
      .select("id", { count: "exact", head: true })
      .eq("class_id", utilization.class_id);

    if (sessionError) {
      return { error: sessionError.message };
    }

    if ((count ?? 0) > 0) {
      return {
        error: "Course utilization has scheduled sessions and cannot be removed.",
      };
    }
  }

  const { data, error } = await supabase
    .from("course_utilization")
    .delete()
    .eq("id", utilization.id)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  if (academicTermId) {
    revalidatePath("/blocks");
  } else {
    revalidatePath("/blocks");
  }
  return { data: true };
};
