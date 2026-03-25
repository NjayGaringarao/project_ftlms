import { CampusProposal } from "./campus_proposal";
import { Designation } from "./designation";
import { EvaluationStatus } from "./evaluation";
import { User } from "./user";

export type CampusProposalStep =
  | "DIRECTOR_FOR_INSTRUCTION"
  | "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";

export type CampusProposalEvaluation = {
  id: string;
  campus_proposal_id: string;
  step: CampusProposalStep;
  designation_id: string | null;
  evaluator_user_id: string | null;
  status: EvaluationStatus;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedCampusProposalEvaluation = CampusProposalEvaluation & {
  campus_proposal: CampusProposal;
  designation: Designation | null;
  evaluator: User | null;
};
