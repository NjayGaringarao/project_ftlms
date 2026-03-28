import { Designation } from "./designation";
import { FacultyLoadProposal } from "./faculty_load_proposal";
import { User } from "./user";

export type EvaluationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type FacultyLoadStep = "CAMPUS_DIRECTOR";

export type FacultyLoadEvaluation = {
  id: string;
  faculty_load_proposal_id: string;
  step: FacultyLoadStep;
  designation_id: string | null;
  evaluator_user_id: string | null;
  status: EvaluationStatus;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedFacultyLoadEvaluation = FacultyLoadEvaluation & {
  designation: Designation | null;
  evaluator: User | null;
  faculty_load_proposal: FacultyLoadProposal;
};

export type Evaluation = FacultyLoadEvaluation;
export type ExtendedEvaluation = ExtendedFacultyLoadEvaluation;
