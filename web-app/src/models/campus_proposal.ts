import { AcademicTerm } from "./academic_term";
import { Campus } from "./campus";
import { Designation } from "./designation";
import { ProposalLifecycleStatus } from "./proposal";
import { User } from "./user";

export type CampusProposal = {
  id: string;
  campus_id: string;
  academic_term_id: string;
  lifecycle_status: ProposalLifecycleStatus;
  invalidated_reason: string | null;
  created_by_user_id: string;
  created_by_designation_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ExtendedCampusProposal = CampusProposal & {
  campus: Campus;
  academic_term: AcademicTerm;
  created_by_user: User;
  created_by_designation: Designation | null;
};
