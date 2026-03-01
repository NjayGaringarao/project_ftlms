import { Course } from "./course";
import { CurriculumOffering } from "./curriculum-at";

export type CourseOffering = {
  id: string;
  curriculum_offering_id: string;
  course_id: string;
};

export type ExtendedCourseOffering = CourseOffering & {
  curriculum_offering: CurriculumOffering;
  course: Course;
};

export type CourseCT = CourseOffering;
export type ExtendedCourseCT = ExtendedCourseOffering;
