import { Block } from "./block";
import { CourseCT } from "./course-c-t";

export type ClassDelivery = {
  id: string;
  schedule_id: string;
  course_offering_id: string;
  block_ids: string[];
};

export type ExtendedClassDelivery = ClassDelivery & {
  course_offering: CourseCT;
  blocks: Block[];
};

export type Class = ClassDelivery;
export type ExtendedClass = ExtendedClassDelivery;
