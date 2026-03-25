import { CampusProposal } from "./campus_proposal";
import { EmploymentStatus, User } from "./user";
import { Proposal, ProposalLifecycleStatus } from "./proposal";

export type CampusProposalMember = {
  id: string;
  campus_proposal_id: string;
  source_proposal_id: string;
  proposal_user_id: string;
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
  source_proposal_lifecycle_status: ProposalLifecycleStatus;
  source_proposal_created_at: string | null;
  created_at: string | null;
};

export type ExtendedCampusProposalMember = CampusProposalMember & {
  campus_proposal: CampusProposal;
  source_proposal: Proposal;
  proposal_user: User;
};
