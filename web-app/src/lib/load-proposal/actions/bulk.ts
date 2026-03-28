"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import {
  canCreateProposalFromRoles,
  createIndividualProposalViaRpc,
  isFinalDecisionStatus,
  parseFacultyIds,
  parseProposalIds,
  resolveCreatorDesignationId,
  toCampusDirectorDesignationByCampus,
} from "@/lib/load-proposal/actions/helpers";
import {
  revalidateFacultyProposalWorkspace,
  revalidateProposalCollectionsByTerm,
  revalidateUniversityCampusWorkspace,
} from "@/lib/load-proposal/actions/revalidation";

export const submitBulkEvaluationAction = async (
  formData: FormData,
): Promise<{ success: boolean; processed: number }> => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const proposalIdsRaw = String(formData.get("proposalIds") ?? "");
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!academicTermId || !isFinalDecisionStatus(status)) {
    return { success: false, processed: 0 };
  }
  if (status === "REJECTED" && comment.length === 0) {
    return { success: false, processed: 0 };
  }

  const proposalIds = parseProposalIds(proposalIdsRaw);
  if (proposalIds.length === 0) {
    return { success: false, processed: 0 };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, processed: 0 };
  }

  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });
  const designationByCampus = toCampusDirectorDesignationByCampus(
    currentUserData?.designations ?? [],
  );
  if (designationByCampus.size === 0) {
    return { success: false, processed: 0 };
  }

  const supabase = await createClient();
  const { data: proposals, error: proposalsError } = await supabase
    .from("faculty_load_proposal")
    .select("id, user_id, campus_id, academic_term_id, lifecycle_status")
    .in("id", proposalIds)
    .eq("academic_term_id", academicTermId);

  if (proposalsError || !proposals || proposals.length === 0) {
    return { success: false, processed: 0 };
  }

  const candidateProposals = proposals.filter(
    (proposal) =>
      proposal.lifecycle_status === "ACTIVE" &&
      !!proposal.campus_id &&
      designationByCampus.has(proposal.campus_id),
  );

  if (candidateProposals.length === 0) {
    return { success: false, processed: 0 };
  }

  const { data: existingEvaluations, error: existingEvaluationError } =
    await supabase
      .from("faculty_load_evaluation")
      .select("faculty_load_proposal_id")
      .in(
        "faculty_load_proposal_id",
        candidateProposals.map((proposal) => proposal.id),
      )
      .eq("step", "CAMPUS_DIRECTOR");

  if (existingEvaluationError) {
    console.error(
      "loadProposal.submitBulkEvaluation.existingEvaluations ::",
      existingEvaluationError,
    );
    return { success: false, processed: 0 };
  }

  const evaluatedProposalIds = new Set(
    (existingEvaluations ?? [])
      .map((row) => row.faculty_load_proposal_id)
      .filter((value): value is string => typeof value === "string"),
  );

  const acceptedProposals = candidateProposals.filter(
    (proposal) => !evaluatedProposalIds.has(proposal.id),
  );

  if (acceptedProposals.length === 0) {
    return { success: false, processed: 0 };
  }

  const successfullyEvaluated = new Array<{
    user_id: string;
    campus_id: string;
  }>();

  for (const proposal of acceptedProposals) {
    if (!proposal.campus_id) continue;
    const designationId = designationByCampus.get(proposal.campus_id);
    if (!designationId) continue;

    const { error: insertError } = await supabase
      .from("faculty_load_evaluation")
      .insert({
        faculty_load_proposal_id: proposal.id,
        step: "CAMPUS_DIRECTOR",
        evaluator_user_id: currentUser.id,
        designation_id: designationId,
        status,
        comment: comment.length > 0 ? comment : null,
      });

    if (insertError) {
      console.error("loadProposal.submitBulkEvaluation.insert ::", {
        proposalId: proposal.id,
        error: insertError,
      });
      continue;
    }

    successfullyEvaluated.push({
      user_id: proposal.user_id,
      campus_id: proposal.campus_id,
    });
  }

  if (successfullyEvaluated.length === 0) {
    return { success: false, processed: 0 };
  }

  revalidateProposalCollectionsByTerm(academicTermId);
  for (const proposal of successfullyEvaluated) {
    revalidateFacultyProposalWorkspace(academicTermId, proposal.user_id);
  }
  const campusIds = Array.from(
    new Set(successfullyEvaluated.map((proposal) => proposal.campus_id)),
  );
  for (const campusId of campusIds) {
    revalidateUniversityCampusWorkspace(academicTermId, campusId);
  }

  return { success: true, processed: successfullyEvaluated.length };
};

export const submitBulkCreateProposalAction = async (
  formData: FormData,
): Promise<{ success: boolean; processed: number; skipped: number }> => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const facultyIdsRaw = String(formData.get("facultyIds") ?? "");

  if (!academicTermId) {
    return { success: false, processed: 0, skipped: 0 };
  }

  const facultyIds = parseFacultyIds(facultyIdsRaw);
  if (facultyIds.length === 0) {
    return { success: false, processed: 0, skipped: 0 };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, processed: 0, skipped: facultyIds.length };
  }

  const roles = await getUserRole();
  if (!canCreateProposalFromRoles(roles)) {
    return { success: false, processed: 0, skipped: facultyIds.length };
  }

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const creatorDesignationId = resolveCreatorDesignationId(
    currentUserData?.designations ?? [],
  );

  let processed = 0;
  let skipped = 0;
  const successfulFacultyIds = new Set<string>();
  const successfulCampusIds = new Set<string>();

  for (const facultyId of facultyIds) {
    const result = await createIndividualProposalViaRpc({
      academicTermId,
      facultyId,
      currentUserId: currentUser.id,
      creatorDesignationId,
      mode: "REQUIRE_NO_OR_INVALIDATED",
    });

    if (!result.success || !result.campusId) {
      skipped += 1;
      continue;
    }

    processed += 1;
    successfulFacultyIds.add(facultyId);
    successfulCampusIds.add(result.campusId);
  }

  if (processed === 0) {
    return { success: false, processed: 0, skipped };
  }

  revalidateProposalCollectionsByTerm(academicTermId);
  for (const facultyId of successfulFacultyIds) {
    revalidateFacultyProposalWorkspace(academicTermId, facultyId);
  }
  for (const campusId of successfulCampusIds) {
    revalidateUniversityCampusWorkspace(academicTermId, campusId);
  }

  return { success: true, processed, skipped };
};
