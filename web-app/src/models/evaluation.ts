import { Evaluator } from "./evaluator";
import { Schedule } from "./schedule";

export type Evaluation = {
  id: string;
  evaluator_id: string;
  schedule_id: string;
  evaluation_level: number;
  evaluator_role: string;
  status: string;
  comment: string | null;
  created_at: string | null;
};

export type ExtendedEvaluation = Evaluation & {
  evaluator: Evaluator;
  schedule: Schedule;
};
