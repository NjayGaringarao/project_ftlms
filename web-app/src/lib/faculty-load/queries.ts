"use server";

import { createClient } from "@/utils/supabase/server";
import type { Proposal, IndividualProposalEvaluation } from "@/models";

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
