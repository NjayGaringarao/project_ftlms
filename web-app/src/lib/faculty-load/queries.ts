"use server";

import { createClient } from "@/utils/supabase/server";
import type { EvaluationMetadata, Proposal, Evaluation } from "@/models";

export type EvaluationWithMetadata = Evaluation & {
  evaluation_metadata: EvaluationMetadata | null;
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
    console.error("faculty-load.getLatestProposal ::", error);
    return null;
  }

  return data ?? null;
};

export const getEvaluationsByProposal = async (
  proposalId: string,
): Promise<EvaluationWithMetadata[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("evaluation")
    .select(
      `
      id,
      designation_id,
      proposal_id,
      evaluation_metadata_id,
      evaluator_user_id,
      status,
      comment,
      created_at,
      evaluation_metadata:evaluation_metadata_id (
        id,
        evaluator_role,
        evaluation_level,
        campus_code
      )
    `,
    )
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("faculty-load.getEvaluationsByProposal ::", error);
    return [];
  }

  return (data ?? []) as EvaluationWithMetadata[];
};

export const getEvaluationMetadataByCampus = async (
  campusCode: string | null,
): Promise<EvaluationMetadata[]> => {
  const supabase = await createClient();

  const { data: globalRows, error: globalError } = await supabase
    .from("evaluation_metadata")
    .select("id, evaluator_role, evaluation_level, campus_code")
    .in("evaluation_level", [1, 2]);

  if (globalError) {
    console.error("faculty-load.getEvaluationMetadata.global ::", globalError);
  }

  let campusRow: EvaluationMetadata | null = null;

  if (campusCode) {
    const { data: campusData, error: campusError } = await supabase
      .from("evaluation_metadata")
      .select("id, evaluator_role, evaluation_level, campus_code")
      .eq("evaluation_level", 0)
      .eq("campus_code", campusCode)
      .maybeSingle();

    if (campusError) {
      console.error("faculty-load.getEvaluationMetadata.campus ::", campusError);
    }

    campusRow = (campusData as EvaluationMetadata | null) ?? null;
  }

  const merged = [campusRow, ...(globalRows ?? [])].filter(Boolean);
  return merged as EvaluationMetadata[];
};
