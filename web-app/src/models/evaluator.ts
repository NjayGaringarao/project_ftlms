import { User } from "./user";

export type Evaluator = {
  user_id: string;
  role: string;
  evaluation_level: number;
  designated_at: string;
};

export type ExtendedEvaluator = Evaluator & {
  user: User;
};
