import { Designation } from "./designation";
import { Schedule } from "./schedule";

export type Evaluation = {
  id: string;
  designation_id: string;
  schedule_id: string;
  evaluation_level: number;
  evaluator_role: string;
  status: string;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedEvaluation = Evaluation & {
  designation: Designation;
  schedule: Schedule;
};
