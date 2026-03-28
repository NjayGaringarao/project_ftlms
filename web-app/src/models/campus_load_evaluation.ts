import { CampusLoad } from "./campus_load";
import { Designation } from "./designation";
import { EvaluationStatus } from "./faculty_load_evaluation";
import { User } from "./user";

export type CampusLoadStep =
  | "DIRECTOR_FOR_INSTRUCTION"
  | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

export type CampusLoadEvaluation = {
  id: string;
  campus_load_id: string;
  step: CampusLoadStep;
  designation_id: string | null;
  evaluator_user_id: string | null;
  status: EvaluationStatus;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedCampusLoadEvaluation = CampusLoadEvaluation & {
  campus_load: CampusLoad;
  designation: Designation | null;
  evaluator: User | null;
};
