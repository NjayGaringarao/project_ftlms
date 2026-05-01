"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  CampusLoad,
  CampusLoadEvaluation,
  FacultyLoadEvaluation,
  ProposalLifecycleStatus,
} from "@/features/shared/types/models";
import type {
  CampusLoadMemberWithFaculty,
  CampusLoadReviewBundle,
  CurrentCampusIndividualProposal,
} from "@/features/ftl-evaluation/lib/load-proposal/read-models";

export const getEvaluationsByProposal = async (
  proposalId: string,
): Promise<FacultyLoadEvaluation[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("faculty_load_evaluation")
    .select(
      `
      id,
      faculty_load_proposal_id,
      step,
      designation_id,
      evaluator_user_id,
      status,
      comment,
      created_at
    `,
    )
    .eq("faculty_load_proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadProposal.getEvaluationsByProposal ::", error);
    return [];
  }

  return (data ?? []) as FacultyLoadEvaluation[];
};

export const getLatestEvaluationByProposal = async (
  proposalId: string,
): Promise<FacultyLoadEvaluation | null> => {
  const rows = await getEvaluationsByProposal(proposalId);
  return rows[0] ?? null;
};

export const getLatestCampusLoadByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusLoad | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_load")
    .select("*")
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("loadProposal.getLatestCampusLoadByCampusTerm ::", error);
    return null;
  }

  return data ?? null;
};

export const getCampusLoadMembers = async (
  campusLoadId: string,
): Promise<CampusLoadMemberWithFaculty[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_load_member")
    .select(
      `
      id,
      campus_load_id,
      source_faculty_load_proposal_id,
      created_at,
      source_faculty_load_proposal:source_faculty_load_proposal_id (
        id,
        user_id,
        campus_id,
        academic_term_id,
        employment_status,
        academic_rank,
        bachelors_degree,
        masters_degree,
        doctorate_degree,
        designations,
        schedule_sessions,
        equivalent_teaching_load,
        total_lecture_hours,
        total_lab_hours,
        preparation_count,
        actual_teaching_load,
        advisory_class,
        lifecycle_status,
        invalidated_reason,
        created_by_user_id,
        created_by_designation_id,
        created_at,
        updated_at,
        faculty_user:user_id (
          id,
          identity:identity (name)
        )
      )
    `,
    )
    .eq("campus_load_id", campusLoadId)
    .order("created_at", {
      ascending: false,
      foreignTable: "source_faculty_load_proposal",
    });

  if (error) {
    console.error("loadProposal.getCampusLoadMembers ::", error);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const rawSourceProposal = Array.isArray(row.source_faculty_load_proposal)
        ? row.source_faculty_load_proposal[0]
        : row.source_faculty_load_proposal;
    const rawFacultyUser = rawSourceProposal
      ? Array.isArray(rawSourceProposal.faculty_user)
        ? rawSourceProposal.faculty_user[0]
        : rawSourceProposal.faculty_user
      : null;
    const rawIdentity = rawFacultyUser
      ? Array.isArray(rawFacultyUser.identity)
        ? rawFacultyUser.identity[0]
        : rawFacultyUser.identity
      : null;
      const normalizedSourceProposal = rawSourceProposal
        ? (() => {
            const proposal = {
              ...(rawSourceProposal as Record<string, unknown>),
            };
            delete proposal.faculty_user;
            return proposal;
          })()
        : null;

      if (!normalizedSourceProposal) return null;

      return {
        ...row,
        source_faculty_load_proposal:
          normalizedSourceProposal as CampusLoadMemberWithFaculty["source_faculty_load_proposal"],
        source_faculty_load_proposal_lifecycle_status:
          (normalizedSourceProposal.lifecycle_status as ProposalLifecycleStatus) ??
          "INVALIDATED",
        source_faculty_load_proposal_created_at:
          typeof normalizedSourceProposal.created_at === "string"
            ? normalizedSourceProposal.created_at
            : null,
        faculty_user: rawFacultyUser
          ? {
              id: String(rawFacultyUser.id),
              identity: rawIdentity
                ? {
                    name:
                      typeof rawIdentity.name === "string" ? rawIdentity.name : null,
                  }
                : null,
            }
          : null,
      } as CampusLoadMemberWithFaculty;
    })
    .filter((row): row is CampusLoadMemberWithFaculty => Boolean(row));
};

export const getCampusLoadEvaluations = async (
  campusLoadId: string,
): Promise<CampusLoadEvaluation[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campus_load_evaluation")
    .select(
      `
      id,
      campus_load_id,
      step,
      designation_id,
      evaluator_user_id,
      status,
      comment,
      created_at
    `,
    )
    .eq("campus_load_id", campusLoadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadProposal.getCampusLoadEvaluations ::", error);
    return [];
  }

  return (data ?? []) as CampusLoadEvaluation[];
};

export const getLatestCampusLoadContextByFacultyProposal = async (
  facultyLoadProposalId: string,
): Promise<{
  campusLoad: CampusLoad | null;
  evaluations: CampusLoadEvaluation[];
}> => {
  const supabase = await createClient();
  const { data: memberRows, error: memberError } = await supabase
    .from("campus_load_member")
    .select("campus_load_id")
    .eq("source_faculty_load_proposal_id", facultyLoadProposalId);

  if (memberError) {
    console.error(
      "loadProposal.getLatestCampusLoadContextByFacultyProposal.members ::",
      memberError,
    );
    return { campusLoad: null, evaluations: [] };
  }

  const campusLoadIds = Array.from(
    new Set(
      (memberRows ?? [])
        .map((row) => row.campus_load_id)
        .filter((value): value is string => typeof value === "string"),
    ),
  );

  if (campusLoadIds.length === 0) {
    return { campusLoad: null, evaluations: [] };
  }

  const { data: campusLoad, error: campusLoadError } = await supabase
    .from("campus_load")
    .select("*")
    .in("id", campusLoadIds)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (campusLoadError || !campusLoad) {
    if (campusLoadError) {
      console.error(
        "loadProposal.getLatestCampusLoadContextByFacultyProposal.campusLoad ::",
        campusLoadError,
      );
    }
    return { campusLoad: null, evaluations: [] };
  }

  const evaluations = await getCampusLoadEvaluations(campusLoad.id);
  return { campusLoad, evaluations };
};

export const getCurrentIndividualProposalsByCampusTerm = async (
  campusId: string,
  academicTermId: string,
): Promise<CurrentCampusIndividualProposal[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("faculty_load_proposal")
    .select("id, user_id, lifecycle_status")
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (error) {
    console.error(
      "loadProposal.getCurrentIndividualProposalsByCampusTerm ::",
      error,
    );
    return [];
  }

  return (
    (data ?? []) as Array<
      CurrentCampusIndividualProposal & {
        lifecycle_status: ProposalLifecycleStatus;
      }
    >
  ).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    lifecycle_status: row.lifecycle_status,
  }));
};

export const getCampusLoadReviewBundle = async (
  campusId: string,
  academicTermId: string,
): Promise<CampusLoadReviewBundle> => {
  const [campusLoad, currentIndividualProposals] = await Promise.all([
    getLatestCampusLoadByCampusTerm(campusId, academicTermId),
    getCurrentIndividualProposalsByCampusTerm(campusId, academicTermId),
  ]);

  if (!campusLoad) {
    return {
      campusLoad: null,
      members: [],
      evaluations: [],
      currentIndividualProposals,
    };
  }

  const [members, evaluations] = await Promise.all([
    getCampusLoadMembers(campusLoad.id),
    getCampusLoadEvaluations(campusLoad.id),
  ]);

  return {
    campusLoad,
    members,
    evaluations,
    currentIndividualProposals,
  };
};
