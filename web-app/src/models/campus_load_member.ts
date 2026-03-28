import { CampusLoad } from "./campus_load";
import { EmploymentStatus, User } from "./user";
import {
  FacultyLoadProposal,
  ProposalLifecycleStatus,
} from "./faculty_load_proposal";

export type CampusLoadMember = {
  id: string;
  campus_load_id: string;
  source_faculty_load_proposal_id: string;
  faculty_user_id: string;
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
  source_faculty_load_proposal_lifecycle_status: ProposalLifecycleStatus;
  source_faculty_load_proposal_created_at: string | null;
  created_at: string | null;
};

export type ExtendedCampusLoadMember = CampusLoadMember & {
  campus_load: CampusLoad;
  source_faculty_load_proposal: FacultyLoadProposal;
  faculty_user: User;
};
