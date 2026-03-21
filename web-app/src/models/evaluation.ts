import { Designation } from "./designation";
import { Proposal } from "./proposal";

export type Evaluation = {
  id: string;
  designation_id: string | null;
  proposal_id: string;
  evaluator_role: string;
  status: string;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedEvaluation = Evaluation & {
  designation: Designation | null;
  proposal: Proposal;
};
