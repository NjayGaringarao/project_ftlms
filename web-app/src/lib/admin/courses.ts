"use server";

import { Course } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type CourseListItem = Course;

export const getCoursesList = async (): Promise<CourseListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course")
    .select("id, code, title, lecture_hour, laboratory_hour")
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.courses.getCoursesList ::", error);
    return [];
  }

  return (data ?? []) as CourseListItem[];
};

export const getCourseById = async (
  courseId: string,
): Promise<Course | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course")
    .select("id, code, title, lecture_hour, laboratory_hour")
    .eq("id", courseId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.courses.getCourseById ::", error);
    return null;
  }

  return (data ?? null) as Course | null;
};
