import type { FacultyListItem } from "@/lib/course-loading/types";

export type ProposalStatusFilter =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INVALIDATED"
  | "NO_PROPOSAL";

export type FacultyProposalListItem = FacultyListItem & {
  latest_proposal_id: string | null;
  latest_proposal_lifecycle_status:
    | "ACTIVE"
    | "APPROVED"
    | "REJECTED"
    | "INVALIDATED"
    | null;
  proposal_filter_status: ProposalStatusFilter;
};
