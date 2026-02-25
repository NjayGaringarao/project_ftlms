"use server";

import { ExtendedCourseCampusAt } from "@/models";
import { createClient } from "@/utils/supabase/server";

export type CourseOfferingListItem = ExtendedCourseCampusAt;

export const getCourseOfferingsList = async (): Promise<
  CourseOfferingListItem[]
> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_campus_at")
    .select(
      `
      id,
      campus_id,
      course_id,
      academic_term_id,
      campus:campus_id (id, name, address, zip_code),
      course:course_id (id, title, lecture_hour, laboratory_hour),
      term:academic_term_id (id, academic_year, term_code, sequence, start, end)
      `,
    )
    .order("id", { ascending: true });

  if (error) {
    console.error(
      "lib.admin.course-offerings.getCourseOfferingsList ::",
      error,
    );
    return [];
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    campus: Array.isArray(item.campus) ? item.campus[0] : item.campus,
    course: Array.isArray(item.course) ? item.course[0] : item.course,
    term: Array.isArray(item.term) ? item.term[0] : item.term,
  })) as CourseOfferingListItem[];
};

export const getCourseOfferingById = async (
  courseOfferingId: string,
): Promise<CourseOfferingListItem | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("course_campus_at")
    .select(
      `
      id,
      campus_id,
      course_id,
      academic_term_id,
      campus:campus_id (id, name, address, zip_code),
      course:course_id (id, title, lecture_hour, laboratory_hour),
      term:academic_term_id (id, academic_year, term_code, sequence, start, end)
      `,
    )
    .eq("id", courseOfferingId)
    .maybeSingle();

  if (error) {
    console.error("lib.admin.course-offerings.getCourseOfferingById ::", error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    campus: Array.isArray(data.campus) ? data.campus[0] : data.campus,
    course: Array.isArray(data.course) ? data.course[0] : data.course,
    term: Array.isArray(data.term) ? data.term[0] : data.term,
  } as CourseOfferingListItem;
};

export const getCourseOfferingsByCampus = async (
  campusId: string,
): Promise<CourseOfferingListItem[]> => {
  const offerings = await getCourseOfferingsList();
  return offerings.filter((offering) => offering.campus_id === campusId);
};
