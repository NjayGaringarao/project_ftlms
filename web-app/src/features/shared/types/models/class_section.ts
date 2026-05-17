import { Section } from "./section";
import { Class } from "./class";

export type ClassSection = {
  id: string;
  class_id: string;
  section_id: string;
};

export type ExtendedClassSection = ClassSection & {
  class: Class;
  section: Section;
};
