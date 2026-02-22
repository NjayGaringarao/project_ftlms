import { Campus } from "./campus";
import { Term } from "./term";

export type Course = {
  id: string;
  campus_id: string | null;
  semester_id: string | null;
  title: string;
  lecture_hour: number | null;
  laboratory_hour: number | null;
};

export type ExtendedCourse = Course & {
  campus: Campus | null;
  term: Term | null;
};
