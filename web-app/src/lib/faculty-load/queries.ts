"use server";

import { createClient } from "@/utils/supabase/server";
import type {
  Proposal,
  ProposalLifecycleStatus,
  IndividualProposalEvaluation,
  CampusProposal,
  CampusProposalEvaluation,
  CampusProposalMember,
} from "@/models";

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
    console.error("faculty-load.getLatestProposal ::", error);
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
    console.error("faculty-load.getEvaluationsByProposal ::", error);
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
    console.error("faculty-load.getLatestCampusProposalByCampusTerm ::", error);
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
    console.error("faculty-load.getCampusProposalMembers ::", error);
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
    console.error("faculty-load.getCampusProposalEvaluations ::", error);
    return [];
  }

  return (data ?? []) as CampusProposalEvaluation[];
};

export type CurrentCampusIndividualProposal = Pick<
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
      "faculty-load.getCurrentIndividualProposalsByCampusTerm ::",
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
