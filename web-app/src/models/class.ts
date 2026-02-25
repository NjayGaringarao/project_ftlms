import { Block } from "./block";
import { CourseCampusAt } from "./course-campus-at";

export type Class = {
  id: string;
  schedule_id: string;
  campus_course_at_id: string;
  block_id: string | null;
};

export type ExtendedClass = Class & {
  course_campus_at: CourseCampusAt;
  block: Block | null;
};
