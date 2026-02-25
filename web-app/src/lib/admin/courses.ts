"use server";

import { Course } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type CourseListItem = Course;

export const getCoursesList = async (): Promise<CourseListItem[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course")
    .select("id, title, lecture_hour, laboratory_hour")
    .order("title", { ascending: true });

  if (error) {
    console.error("lib.admin.courses.getCoursesList ::", error);
    return [];
  }

  return (data ?? []) as CourseListItem[];
};
