import { AcademicTerm } from "./academic_term";
import { User, EmploymentStatus } from "./user";

export type Proposal = {
  id: string;
  user_id: string;
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
  is_valid: boolean;
  created_at: string | null;
};

export type ExtendedProposal = Proposal & {
  user: User;
  academic_term: AcademicTerm;
};
