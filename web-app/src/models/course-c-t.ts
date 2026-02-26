import { Course } from "./course";
import { CurriculumAt } from "./curriculum-at";

export type CourseCT = {
  id: string;
  curriculum_at_id: string;
  course_id: string;
};

export type ExtendedCourseCT = CourseCT & {
  curriculum_at: CurriculumAt;
  course: Course;
};
