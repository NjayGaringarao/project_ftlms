import { Campus } from "./campus";
import { Semester } from "./semester";

export type Course = {
  id: string;
  campus_id: string;
  semester_id: string;
  code: string;
  title: string;
  lecture_hour: number;
  laboratory_hour: number;
};

export type ExtendedCourse = Course & {
  campus: Campus;
  semester: Semester;
};
