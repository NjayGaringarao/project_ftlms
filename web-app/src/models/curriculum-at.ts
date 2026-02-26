import { Curriculum } from "./curriculum";
import { Term } from "./term";

export type CurriculumAt = {
  id: string;
  curriculum_id: string;
  academic_term_id: string;
};

export type ExtendedCurriculumAt = CurriculumAt & {
  curriculum: Curriculum;
  term: Term;
};
