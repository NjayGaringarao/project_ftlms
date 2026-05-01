import type {
  CampusLoad,
  CampusLoadEvaluation,
  CampusLoadMember,
  FacultyLoadProposal,
  ProposalLifecycleStatus,
} from "@/features/shared/types/models";

export type CampusLoadMemberWithFaculty = CampusLoadMember & {
  source_faculty_load_proposal: FacultyLoadProposal;
  source_faculty_load_proposal_lifecycle_status: ProposalLifecycleStatus;
  source_faculty_load_proposal_created_at: string | null;
  faculty_user: {
    id: string;
    identity: {
      name: string | null;
    } | null;
  } | null;
};

export type CurrentCampusIndividualProposal = Pick<
  FacultyLoadProposal,
  "id" | "user_id" | "lifecycle_status"
>;

export type LatestCampusIndividualProposal = Pick<
  FacultyLoadProposal,
  "id" | "user_id" | "lifecycle_status"
> & {
  faculty_name: string | null;
};

export type CampusLoadReviewBundle = {
  campusLoad: CampusLoad | null;
  members: CampusLoadMemberWithFaculty[];
  evaluations: CampusLoadEvaluation[];
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

export type CampusLoadInsightsBundle = CampusLoadReviewBundle & {
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
