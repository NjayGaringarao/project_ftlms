import { Identity } from "./identity";
import { AcademicRank } from "./rank";

export type UserRole = "FACULTY" | "CHAIR" | "EVALUATOR" | "DIRECTOR" | "ADMIN";

export type User = {
  id: string;
  academic_rank_id: string | null;
  employment_status: "FULL_TIME" | "PART_TIME";
};

export type ExtendedUser = User & {
  identity: Identity; // Always exists due to 1:1 relationship
  rank: AcademicRank | null;
};
