import { Designation } from "./designation";
import { EvaluationMetadata } from "./evaluation_metadata";
import { Proposal } from "./proposal";
import { User } from "./user";

export type Evaluation = {
  id: string;
  designation_id: string | null;
  proposal_id: string;
  evaluation_metadata_id: string;
  evaluator_user_id: string | null;
  status: string;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedEvaluation = Evaluation & {
  designation: Designation | null;
  evaluator: User | null;
  evaluation_metadata: EvaluationMetadata | null;
  proposal: Proposal;
};
