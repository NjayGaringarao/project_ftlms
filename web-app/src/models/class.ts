import { Block } from "./block";
import { Course } from "./course";

export type Class = {
  id: string;
  schedule_id: string;
  course_id: string;
  block_id: string;
  student_count: number;
};

export type ExtendedClass = Class & {
  course: Course;
  block: Block;
};
