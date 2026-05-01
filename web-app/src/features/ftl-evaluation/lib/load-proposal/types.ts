import type { FacultyListItem } from "@/features/faculty-teaching-load/lib/course-loading/types";

export type ProposalStatusFilter =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "INVALIDATED"
  | "NO_PROPOSAL";

export type FacultyProposalListItem = FacultyListItem & {
  latest_faculty_load_proposal_id: string | null;
  latest_proposal_lifecycle_status:
    | "ACTIVE"
    | "APPROVED"
    | "REJECTED"
    | "INVALIDATED"
    | null;
  proposal_filter_status: ProposalStatusFilter;
};
