import { Block } from "./block";
import { CourseCT } from "./course-c-t";

export type Class = {
  id: string;
  schedule_id: string;
  course_c_t_id: string;
  block_id: string | null;
};

export type ExtendedClass = Class & {
  course_c_t: CourseCT;
  block: Block | null;
};
