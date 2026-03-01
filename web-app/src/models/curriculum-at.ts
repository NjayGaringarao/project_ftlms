import { Curriculum } from "./curriculum";
import { Term } from "./term";

export type CurriculumOffering = {
  id: string;
  curriculum_id: string;
  academic_term_id: string;
};

export type ExtendedCurriculumOffering = CurriculumOffering & {
  curriculum: Curriculum;
  term: Term;
};

export type CurriculumAt = CurriculumOffering;
export type ExtendedCurriculumAt = ExtendedCurriculumOffering;
