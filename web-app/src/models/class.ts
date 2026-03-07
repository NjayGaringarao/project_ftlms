import { Course } from "./course";
import { Schedule } from "./schedule";

export type Class = {
  id: string;
  code: string;
  schedule_id: string;
  course_id: string;
};

export type ExtendedClass = Class & {
  schedule: Schedule;
  course: Course;
};
