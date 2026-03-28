"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  CampusLoad,
  CampusLoadEvaluation,
  FacultyLoadEvaluation,
  ProposalLifecycleStatus,
} from "@/models";
import type {
  CampusLoadMemberWithFaculty,
  CampusLoadReviewBundle,
  CurrentCampusIndividualProposal,
} from "@/lib/load-proposal/read-models";

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
      faculty_user_id,
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
      source_faculty_load_proposal_lifecycle_status,
      source_faculty_load_proposal_created_at,
      created_at,
      faculty_user:faculty_user_id (
        id,
        identity:identity (name)
      )
    `,
    )
    .eq("campus_load_id", campusLoadId)
    .order("source_faculty_load_proposal_created_at", { ascending: false });

  if (error) {
    console.error("loadProposal.getCampusLoadMembers ::", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const rawFacultyUser = Array.isArray(row.faculty_user)
      ? row.faculty_user[0]
      : row.faculty_user;
    const rawIdentity = rawFacultyUser
      ? Array.isArray(rawFacultyUser.identity)
        ? rawFacultyUser.identity[0]
        : rawFacultyUser.identity
      : null;

    return {
      ...row,
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
  });
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
