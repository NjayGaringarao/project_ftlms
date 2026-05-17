import { Section } from "./section";
import { Class } from "./class";
import { Course } from "./course";

export type CourseUtilization = {
  id: string;
  class_id: string | null;
  course_id: string;
  section_id: string;
  created_at?: string | null;
};

export type ExtendedCourseUtilization = CourseUtilization & {
  class: Class | null;
  course: Course;
  section: Section;
};
