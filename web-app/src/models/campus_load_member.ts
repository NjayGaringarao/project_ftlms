import { CampusLoad } from "./campus_load";
import {
  FacultyLoadProposal,
  ProposalLifecycleStatus,
} from "./faculty_load_proposal";
import { User } from "./user";

export type CampusLoadMember = {
  id: string;
  campus_load_id: string;
  source_faculty_load_proposal_id: string;
  created_at: string | null;
};

export type ExtendedCampusLoadMember = CampusLoadMember & {
  campus_load: CampusLoad;
  source_faculty_load_proposal: FacultyLoadProposal;
  faculty_user: User;
  source_faculty_load_proposal_lifecycle_status: ProposalLifecycleStatus;
  source_faculty_load_proposal_created_at: string | null;
};
