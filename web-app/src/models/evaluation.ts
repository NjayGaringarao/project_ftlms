import { Designation } from "./designation";
import { Proposal } from "./proposal";
import { User } from "./user";

export type EvaluationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IndividualProposalStep = "CAMPUS_DIRECTOR";

export type IndividualProposalEvaluation = {
  id: string;
  proposal_id: string;
  step: IndividualProposalStep;
  designation_id: string | null;
  evaluator_user_id: string | null;
  status: EvaluationStatus;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedIndividualProposalEvaluation = IndividualProposalEvaluation & {
  designation: Designation | null;
  evaluator: User | null;
  proposal: Proposal;
};

export type Evaluation = IndividualProposalEvaluation;
export type ExtendedEvaluation = ExtendedIndividualProposalEvaluation;
