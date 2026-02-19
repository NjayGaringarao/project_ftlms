import { Identity } from "./identity";
import { Rank } from "./rank";

export type UserRole = "FACULTY" | "CHAIR" | "EVALUATOR" | "DIRECTOR" | "ADMIN";

export type User = {
  id: string;
  rank_id: string | null;
  employment_status: string | null;
};

export type ExtendedUser = User & {
  identity: Identity; // Always exists due to 1:1 relationship
  rank: Rank | null;
};
