import type {
  CampusProposal,
  CampusProposalEvaluation,
  CampusProposalMember,
  Proposal,
  ProposalLifecycleStatus,
} from "@/models";

export type CampusProposalMemberWithFaculty = CampusProposalMember & {
  proposal_user: {
    id: string;
    identity: {
      name: string | null;
    } | null;
  } | null;
};

export type CurrentCampusIndividualProposal = Pick<
  Proposal,
  "id" | "user_id" | "lifecycle_status"
>;

export type LatestCampusIndividualProposal = Pick<
  Proposal,
  "id" | "user_id" | "lifecycle_status"
> & {
  faculty_name: string | null;
};

export type CampusProposalReviewBundle = {
  campusProposal: CampusProposal | null;
  members: CampusProposalMemberWithFaculty[];
  evaluations: CampusProposalEvaluation[];
  currentIndividualProposals: CurrentCampusIndividualProposal[];
};

export type CampusLoadBand = "OVERLOAD" | "UNDERLOAD" | "NORMAL";

export type CampusLoadDistribution = {
  overload: number;
  underload: number;
  normal: number;
  total: number;
};

export type CampusEtlAtlFacultyMetric = {
  faculty_id: string;
  faculty_name: string;
  etl: number;
  atl: number;
  twl: number;
  load_band: CampusLoadBand;
};

export type CampusProposalInsightsBundle = CampusProposalReviewBundle & {
  approvedIndividualCount: number;
  activeIndividualCount: number;
  liveLoadDistribution: CampusLoadDistribution;
  etlAtlPerFaculty: CampusEtlAtlFacultyMetric[];
  latestIndividualProposals: LatestCampusIndividualProposal[];
};

export type ProposalLifecycleLike =
  | ProposalLifecycleStatus
  | null
  | undefined;
