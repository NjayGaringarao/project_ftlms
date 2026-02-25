import { Campus } from "./campus";
import { Course } from "./course";
import { Term } from "./term";

export type CourseCampusAt = {
  id: string;
  campus_id: string;
  course_id: string;
  academic_term_id: string;
};

export type ExtendedCourseCampusAt = CourseCampusAt & {
  campus: Campus;
  course: Course;
  term: Term;
};
