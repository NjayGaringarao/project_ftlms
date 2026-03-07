import { Identity } from "./identity";
import { AcademicRank } from "./academic_rank";

export type EmploymentStatus =
  | "Regular"
  | "Part-time"
  | "Contract of Service"
  | "Temporary";

export type User = {
  id: string;
  academic_rank_id: string | null;
  employment_status: EmploymentStatus;
};

export type ExtendedUser = User & {
  identity: Identity; // Always exists due to 1:1 relationship
  rank: AcademicRank | null;
};

export type UserRole =
  | "Faculty"
  | "Program Chairperson"
  | "Campus Director"
  | "College Dean"
  | "University President"
  | "Director for Instruction"
  | "Admin";
