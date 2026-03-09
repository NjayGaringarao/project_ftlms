import {
  AcademicRank,
  AcademicTerm,
  Degree,
  ExtendedDesignation,
  Identity,
} from "@/models";

export type OverviewClassLoad = {
  id: string;
  class_code: string;
  course_code: string;
  course_title: string;
  lecture_unit: number;
  laboratory_unit: number;
  year_section: string;
  campus_name: string;
  load: number;
};

export type UserOverviewReadModel = {
  id: string;
  email: string | null;
  emailConfirmedAt: string | null;
  accountCreatedAt: string | null;
  lastSignInAt: string | null;
  accountType: "Admin" | "User";
  identity: Identity | null;
  employmentStatus: string | null;
  rank: AcademicRank | null;
  degrees: Degree[];
  designations: Omit<ExtendedDesignation, "user">[];
  term: AcademicTerm | null;
  classes: OverviewClassLoad[];
  actualTeachingLoad: number;
  designationLoad: number;
  totalWorkingLoad: number;
};

export type UserOverviewListItem = Pick<
  UserOverviewReadModel,
  "id" | "email" | "identity" | "employmentStatus"
>;

export type UserOverviewRpcRow = {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  account_created_at: string | null;
  last_sign_in_at: string | null;
  account_type: string | null;
  employment_status: string | null;
  academic_rank_id: string | null;
  academic_rank_code: string | null;
  academic_rank_title: string | null;
  academic_rank_description: string | null;
  identity: Identity | null;
  designations: unknown;
  degrees: unknown;
  current_term: AcademicTerm | null;
  classes: unknown;
  actual_teaching_load: number | string | null;
};
