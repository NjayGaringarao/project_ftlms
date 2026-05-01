import { Block } from "./block";
import { Class } from "./class";
import { Course } from "./course";

export type CourseUtilization = {
  id: string;
  class_id: string | null;
  course_id: string;
  block_id: string;
  created_at?: string | null;
};

export type ExtendedCourseUtilization = CourseUtilization & {
  class: Class | null;
  course: Course;
  block: Block;
};
