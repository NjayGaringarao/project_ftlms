"use server";

import { createClient } from "@/utils/supabase/server";
import { getFacultyListByTerm } from "@/lib/course-loading/queries";
import { getUserDataList } from "@/lib/user-data/queries";
import type {
  Proposal,
  ProposalLifecycleStatus,
  IndividualProposalEvaluation,
  CampusProposal,
  CampusProposalEvaluation,
  CampusProposalMember,
} from "@/models";
import type {
  FacultyProposalListItem,
  ProposalStatusFilter,
} from "@/lib/proposal/types";

const toProposalFilterStatus = (
  lifecycleStatus: ProposalLifecycleStatus | null,
): ProposalStatusFilter => {
  if (lifecycleStatus === "ACTIVE") return "PENDING";
  if (lifecycleStatus === "APPROVED") return "APPROVED";
  if (lifecycleStatus === "REJECTED") return "REJECTED";
  if (lifecycleStatus === "INVALIDATED") return "INVALIDATED";
  return "NO_PROPOSAL";
};

export const getFacultyProposalListByTerm = async (
  academicTermId: string,
): Promise<FacultyProposalListItem[]> => {
  const facultyList = await getFacultyListByTerm(academicTermId);
  if (facultyList.length === 0) return [];

  const facultyIds = facultyList.map((item) => item.id);
  const supabase = await createClient();
  const { data: proposalRows, error } = await supabase
    .from("proposal")
    .select("id, user_id, lifecycle_status, created_at")
    .eq("academic_term_id", academicTermId)
    .in("user_id", facultyIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getFacultyProposalListByTerm.proposals ::", error);
    return facultyList.map((item) => ({
      ...item,
      latest_proposal_id: null,
      latest_proposal_lifecycle_status: null,
      proposal_filter_status: "NO_PROPOSAL",
    }));
  }

  const latestProposalByFacultyId = new Map<
    string,
    {
      id: string;
      lifecycle_status: ProposalLifecycleStatus;
    }
  >();

  for (const row of proposalRows ?? []) {
    if (!row.user_id || latestProposalByFacultyId.has(row.user_id)) continue;
    latestProposalByFacultyId.set(row.user_id, {
      id: row.id,
      lifecycle_status: row.lifecycle_status as ProposalLifecycleStatus,
    });
  }

  return facultyList.map((item) => {
    const latestProposal = latestProposalByFacultyId.get(item.id) ?? null;
    const lifecycleStatus = latestProposal?.lifecycle_status ?? null;
    return {
      ...item,
      latest_proposal_id: latestProposal?.id ?? null,
      latest_proposal_lifecycle_status: lifecycleStatus,
      proposal_filter_status: toProposalFilterStatus(lifecycleStatus),
    };
  });
};

export const getLatestProposalByUserTerm = async (
  userId: string,
  academicTermId: string,
): Promise<Proposal | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposal")
    .select("*")
    .eq("user_id", userId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("proposal.getLatestProposal ::", error);
    return null;
  }

  return data ?? null;
};

export const getEvaluationsByProposal = async (
  proposalId: string,
): Promise<IndividualProposalEvaluation[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("individual_proposal_evaluation")
    .select(
      `
      id,
      proposal_id,
      step,
      designation_id,
      evaluator_user_id,
      status,
      comment,
      created_at
    `,
    )
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getEvaluationsByProposal ::", error);
    return [];
  }

  return (data ?? []) as IndividualProposalEvaluation[];
};

export const getLatestEvaluationByProposal = async (
  proposalId: string,
): Promise<IndividualProposalEvaluation | null> => {
  const rows = await getEvaluationsByProposal(proposalId);
  return rows[0] ?? null;
};

export type CampusProposalMemberWithFaculty = CampusProposalMember & {
  proposal_user: {
    id: string;
    identity: {
      name: string | null;
    } | null;
  } | null;
};

export const getLatestCampusProposalByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusProposal | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_proposal")
    .select("*")
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("proposal.getLatestCampusProposalByCampusTerm ::", error);
    return null;
  }

  return data ?? null;
};

export const getCampusProposalMembers = async (
  campusProposalId: string,
): Promise<CampusProposalMemberWithFaculty[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_proposal_member")
    .select(
      `
      id,
      campus_proposal_id,
      source_proposal_id,
      proposal_user_id,
      employment_status,
      academic_rank,
      bachelors_degree,
      masters_degree,
      doctorate_degree,
      designations,
      equivalent_teaching_load,
      total_lecture_hours,
      total_lab_hours,
      preparation_count,
      actual_teaching_load,
      advisory_class,
      source_proposal_lifecycle_status,
      source_proposal_created_at,
      created_at,
      proposal_user:proposal_user_id (
        id,
        identity:identity (name)
      )
    `,
    )
    .eq("campus_proposal_id", campusProposalId)
    .order("source_proposal_created_at", { ascending: false });

  if (error) {
    console.error("proposal.getCampusProposalMembers ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const rawProposalUser = Array.isArray(row.proposal_user)
      ? row.proposal_user[0]
      : row.proposal_user;
    const rawIdentity = rawProposalUser
      ? Array.isArray(rawProposalUser.identity)
        ? rawProposalUser.identity[0]
        : rawProposalUser.identity
      : null;

    return {
      ...row,
      proposal_user: rawProposalUser
        ? {
            id: String(rawProposalUser.id),
            identity: rawIdentity
              ? {
                  name:
                    typeof rawIdentity.name === "string" ? rawIdentity.name : null,
                }
              : null,
          }
        : null,
    } as CampusProposalMemberWithFaculty;
  });
};

export const getCampusProposalEvaluations = async (
  campusProposalId: string,
): Promise<CampusProposalEvaluation[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_proposal_evaluation")
    .select(
      `
      id,
      campus_proposal_id,
      step,
      designation_id,
      evaluator_user_id,
      status,
      comment,
      created_at
    `,
    )
    .eq("campus_proposal_id", campusProposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getCampusProposalEvaluations ::", error);
    return [];
  }

  return (data ?? []) as CampusProposalEvaluation[];
};

export type CurrentCampusIndividualProposal = Pick<
  Proposal,
  "id" | "user_id" | "lifecycle_status"
>;

export type LatestCampusIndividualProposal = Pick<
  Proposal,
  "id" | "user_id" | "lifecycle_status"
>;

export const getCurrentIndividualProposalsByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<CurrentCampusIndividualProposal[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposal")
    .select("id, user_id, lifecycle_status")
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (error) {
    console.error(
      "proposal.getCurrentIndividualProposalsByCampusTerm ::",
      error,
    );
    return [];
  }

  return ((data ?? []) as Array<CurrentCampusIndividualProposal & { lifecycle_status: ProposalLifecycleStatus }>).map(
    (row) => ({
      id: row.id,
      user_id: row.user_id,
      lifecycle_status: row.lifecycle_status,
    }),
  );
};

export const getLatestIndividualProposalsByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<LatestCampusIndividualProposal[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposal")
    .select("id, user_id, lifecycle_status, created_at")
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("proposal.getLatestIndividualProposalsByCampusTerm ::", error);
    return [];
  }

  const latestByFacultyId = new Map<string, LatestCampusIndividualProposal>();
  for (const row of data ?? []) {
    if (!row.user_id || latestByFacultyId.has(row.user_id)) continue;
    latestByFacultyId.set(row.user_id, {
      id: row.id,
      user_id: row.user_id,
      lifecycle_status: row.lifecycle_status as ProposalLifecycleStatus,
    });
  }

  return Array.from(latestByFacultyId.values());
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

const classifyLoadBand = (twl: number): CampusLoadBand => {
  if (twl > 24) return "OVERLOAD";
  if (twl < 21) return "UNDERLOAD";
  return "NORMAL";
};

export const getCampusProposalReviewBundle = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusProposalReviewBundle> => {
  const [campusProposal, currentIndividualProposals] = await Promise.all([
    getLatestCampusProposalByCampusTerm(campusId, academicTermId),
    getCurrentIndividualProposalsByCampusTerm(campusId, academicTermId),
  ]);

  if (!campusProposal) {
    return {
      campusProposal: null,
      members: [],
      evaluations: [],
      currentIndividualProposals,
    };
  }

  const [members, evaluations] = await Promise.all([
    getCampusProposalMembers(campusProposal.id),
    getCampusProposalEvaluations(campusProposal.id),
  ]);

  return {
    campusProposal,
    members,
    evaluations,
    currentIndividualProposals,
  };
};

export const getCampusProposalInsightsBundle = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusProposalInsightsBundle> => {
  const [reviewBundle, userDataRows, facultyList, latestIndividualProposals] =
    await Promise.all([
    getCampusProposalReviewBundle(campusId, academicTermId),
    getUserDataList({
      academicTermId,
      includeLoads: true,
    }),
    getFacultyListByTerm(academicTermId),
    getLatestIndividualProposalsByCampusTerm(campusId, academicTermId),
  ]);

  const facultyIdSet = new Set(facultyList.map((faculty) => faculty.id));

  const etlAtlPerFaculty = userDataRows
    .filter((row) => row.accountType !== "Admin")
    .filter((row) => facultyIdSet.has(row.id))
    .filter((row) => row.campus_id === campusId)
    .map((row) => {
      const etl = Number(row.designationLoad ?? 0);
      const atl = Number(row.actualTeachingLoad ?? 0);
      const twl = Number(row.totalWorkingLoad ?? etl + atl);
      return {
        faculty_id: row.id,
        faculty_name: row.identity?.name ?? "Unknown Faculty",
        etl,
        atl,
        twl,
        load_band: classifyLoadBand(twl),
      } satisfies CampusEtlAtlFacultyMetric;
    })
    .sort((a, b) => a.faculty_name.localeCompare(b.faculty_name));

  const liveLoadDistribution = etlAtlPerFaculty.reduce<CampusLoadDistribution>(
    (acc, item) => {
      if (item.load_band === "OVERLOAD") acc.overload += 1;
      if (item.load_band === "UNDERLOAD") acc.underload += 1;
      if (item.load_band === "NORMAL") acc.normal += 1;
      acc.total += 1;
      return acc;
    },
    {
      overload: 0,
      underload: 0,
      normal: 0,
      total: 0,
    },
  );

  const approvedIndividualCount =
    reviewBundle.currentIndividualProposals.filter(
      (item) => item.lifecycle_status === "APPROVED",
    ).length;

  const activeIndividualCount = reviewBundle.currentIndividualProposals.filter(
    (item) => item.lifecycle_status === "ACTIVE",
  ).length;

  return {
    ...reviewBundle,
    approvedIndividualCount,
    activeIndividualCount,
    liveLoadDistribution,
    etlAtlPerFaculty,
    latestIndividualProposals,
  };
};
