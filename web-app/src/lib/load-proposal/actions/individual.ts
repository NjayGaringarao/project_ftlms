"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import {
  canCreateProposalFromRoles,
  createIndividualProposalViaRpc,
  isFinalDecisionStatus,
  resolveCreatorDesignationId,
  toCampusDirectorDesignationByCampus,
} from "@/lib/load-proposal/actions/helpers";
import {
  revalidateFacultyProposalWorkspace,
  revalidateProposalCollectionsByTerm,
  revalidateUniversityCampusWorkspace,
} from "@/lib/load-proposal/actions/revalidation";

export const createProposalAction = async (formData: FormData) => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const facultyId = String(formData.get("facultyId") ?? "");

  if (!academicTermId || !facultyId) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const roles = await getUserRole();
  if (!canCreateProposalFromRoles(roles)) return;

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const creatorDesignationId = resolveCreatorDesignationId(
    currentUserData?.designations ?? [],
  );

  const result = await createIndividualProposalViaRpc({
    academicTermId,
    facultyId,
    currentUserId: currentUser.id,
    creatorDesignationId,
    mode: "ALLOW_RECREATE",
  });

  if (!result.success) return;

  revalidateProposalCollectionsByTerm(academicTermId);
  revalidateFacultyProposalWorkspace(academicTermId, facultyId);
  if (result.campusId) {
    revalidateUniversityCampusWorkspace(academicTermId, result.campusId);
  }
};

export const submitEvaluationAction = async (formData: FormData) => {
  const facultyLoadProposalId = String(
    formData.get("facultyLoadProposalId") ?? "",
  );
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!facultyLoadProposalId || !isFinalDecisionStatus(status)) return;
  if (status === "REJECTED" && comment.length === 0) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });
  const designationByCampus = toCampusDirectorDesignationByCampus(
    currentUserData?.designations ?? [],
  );

  const supabase = await createClient();
  const { data: proposal, error: proposalError } = await supabase
    .from("faculty_load_proposal")
    .select("id, user_id, campus_id, academic_term_id, lifecycle_status")
    .eq("id", facultyLoadProposalId)
    .maybeSingle();

  if (
    proposalError ||
    !proposal ||
    proposal.lifecycle_status !== "ACTIVE" ||
    !proposal.campus_id
  ) {
    return;
  }

  const { data: existingEvaluation } = await supabase
    .from("faculty_load_evaluation")
    .select("id")
    .eq("faculty_load_proposal_id", facultyLoadProposalId)
    .eq("step", "CAMPUS_DIRECTOR")
    .maybeSingle();

  if (existingEvaluation?.id) return;

  const designationId = designationByCampus.get(proposal.campus_id);
  if (!designationId) return;

  const { error: insertError } = await supabase
    .from("faculty_load_evaluation")
    .insert({
      faculty_load_proposal_id: facultyLoadProposalId,
      step: "CAMPUS_DIRECTOR",
      evaluator_user_id: currentUser.id,
      designation_id: designationId,
      status,
      comment: comment.length > 0 ? comment : null,
    });

  if (insertError) {
    console.error("loadProposal.submitEvaluation.insert ::", insertError);
    return;
  }

  revalidateProposalCollectionsByTerm(proposal.academic_term_id);
  revalidateFacultyProposalWorkspace(
    proposal.academic_term_id,
    proposal.user_id,
  );
};
