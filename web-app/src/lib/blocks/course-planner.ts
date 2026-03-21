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

  revalidatePath(`/blocks/${blockId}`);
  return { data: true };
};

export const removeCourseFromBlock = async (
  blockId: string,
  courseId: string,
): Promise<{ data?: boolean; error?: string }> => {
  if (!blockId?.trim()) return { error: "Block is required" };
  if (!courseId?.trim()) return { error: "Course is required" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_utilization")
    .delete()
    .eq("block_id", blockId)
    .eq("course_id", courseId)
    .is("class_id", null)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: "Course is already scheduled and cannot be removed." };
  }

  revalidatePath(`/blocks/${blockId}`);
  return { data: true };
};
