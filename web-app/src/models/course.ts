import { Campus } from "./campus";
import { Term } from "./term";

export type Course = {
  id: string;
  campus_id: string;
  academic_term_id: string;
  title: string;
  lecture_hour: number | null;
  laboratory_hour: number | null;
};

export type ExtendedCourse = Course & {
  campus: Campus | null;
  term: Term | null;
};
