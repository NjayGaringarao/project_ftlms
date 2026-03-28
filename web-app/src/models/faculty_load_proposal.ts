import { AcademicTerm } from "./academic_term";
import { Campus } from "./campus";
import { Designation } from "./designation";
import { User, EmploymentStatus } from "./user";

export type ProposalLifecycleStatus =
  | "ACTIVE"
  | "APPROVED"
  | "REJECTED"
  | "INVALIDATED";

export type FacultyLoadProposal = {
  id: string;
  user_id: string;
  campus_id: string;
  academic_term_id: string;
  employment_status: EmploymentStatus;
  academic_rank: string | null;
  bachelors_degree: string | null;
  masters_degree: string | null;
  doctorate_degree: string | null;
  designations: string | null;
  equivalent_teaching_load: number | null;
  total_lecture_hours: number | null;
  total_lab_hours: number | null;
  preparation_count: number | null;
  actual_teaching_load: number | null;
  advisory_class: string | null;
  lifecycle_status: ProposalLifecycleStatus;
  invalidated_reason: string | null;
  created_by_user_id: string | null;
  created_by_designation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ExtendedFacultyLoadProposal = FacultyLoadProposal & {
  user: User;
  campus: Campus;
  academic_term: AcademicTerm;
  created_by_user: User | null;
  created_by_designation: Designation | null;
};
