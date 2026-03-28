"use server";

import { createClient } from "@/utils/supabase/server";
import { getCurrentUser } from "@/lib/auth/utils";
import { getCurrentUserData } from "@/lib/user-data/queries";
import type { CampusLoadStep } from "@/models";
import {
  createCampusLoadViaRpc,
  isFinalDecisionStatus,
  parseProposalIds,
} from "@/lib/load-proposal/actions/helpers";
import {
  revalidateFacultyProposalWorkspace,
  revalidateProposalCollectionsByTerm,
  revalidateUniversityCampusWorkspace,
} from "@/lib/load-proposal/actions/revalidation";

export const createCampusLoadAction = async (formData: FormData) => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const campusId = String(formData.get("campusId") ?? "");

  if (!academicTermId || !campusId) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });

  const campusDirectorDesignation = currentUserData?.designations.find(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === campusId,
  );

  if (!campusDirectorDesignation) return;

  const result = await createCampusLoadViaRpc({
    academicTermId,
    campusId,
    createdByUserId: currentUser.id,
    createdByDesignationId: campusDirectorDesignation.id,
  });

  if (!result.success || !result.campusId) return;

  revalidateProposalCollectionsByTerm(academicTermId);
  revalidateUniversityCampusWorkspace(academicTermId, result.campusId);
};

export const submitCampusLoadEvaluationAction = async (
  formData: FormData,
) => {
  const campusLoadId = String(formData.get("campusLoadId") ?? "");
  const step = String(formData.get("step") ?? "") as CampusLoadStep;
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!campusLoadId || !isFinalDecisionStatus(status)) return;
  if (
    step !== "DIRECTOR_FOR_INSTRUCTION" &&
    step !== "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS"
  ) {
    return;
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });

  const expectedRole =
    step === "DIRECTOR_FOR_INSTRUCTION"
      ? "Director for Instruction"
      : "Vice President for Academic Affairs";

  const matchingDesignation = currentUserData?.designations.find(
    (designation) => designation.job_title === expectedRole,
  );

  if (!matchingDesignation) return;

  const supabase = await createClient();
  const { data: campusLoad } = await supabase
    .from("campus_load")
    .select("id, campus_id, academic_term_id, lifecycle_status")
    .eq("id", campusLoadId)
    .maybeSingle();

  if (!campusLoad || campusLoad.lifecycle_status !== "ACTIVE") return;

  const { data: existingStep } = await supabase
    .from("campus_load_evaluation")
    .select("id")
    .eq("campus_load_id", campusLoadId)
    .eq("step", step)
    .maybeSingle();

  if (existingStep?.id) return;

  if (step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS") {
    const { data: dfiRow } = await supabase
      .from("campus_load_evaluation")
      .select("id, status")
      .eq("campus_load_id", campusLoadId)
      .eq("step", "DIRECTOR_FOR_INSTRUCTION")
      .maybeSingle();

    if (!dfiRow || dfiRow.status !== "APPROVED") return;
  }

  const { error: insertError } = await supabase
    .from("campus_load_evaluation")
    .insert({
      campus_load_id: campusLoadId,
      step,
      evaluator_user_id: currentUser.id,
      designation_id: matchingDesignation.id,
      status,
      comment: comment.length > 0 ? comment : null,
    });

  if (insertError) {
    console.error("loadProposal.submitCampusLoadEvaluation.insert ::", insertError);
    return;
  }

  revalidateProposalCollectionsByTerm(campusLoad.academic_term_id);
  revalidateUniversityCampusWorkspace(
    campusLoad.academic_term_id,
    campusLoad.campus_id,
  );
};

export const invalidateIndividualProposalsAction = async (formData: FormData) => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const proposalIdsRaw = String(formData.get("proposalIds") ?? "");

  const proposalIds = parseProposalIds(proposalIdsRaw);

  if (!academicTermId || proposalIds.length === 0) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const supabase = await createClient();
  const { data: proposals, error: proposalFetchError } = await supabase
    .from("faculty_load_proposal")
    .select("id, user_id, campus_id, academic_term_id, lifecycle_status")
    .in("id", proposalIds)
    .eq("academic_term_id", academicTermId);

  if (proposalFetchError || !proposals || proposals.length === 0) return;

  const campusId = proposals[0]?.campus_id;
  if (!campusId) return;

  if (proposals.some((proposal) => proposal.campus_id !== campusId)) {
    return;
  }

  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });
  const campusDirectorDesignation = currentUserData?.designations.find(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === campusId,
  );

  if (!campusDirectorDesignation) return;

  const { error: invalidateProposalsError } = await supabase
    .from("faculty_load_proposal")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "MANUAL_CAMPUS_DIRECTOR_INVALIDATION",
    })
    .in("id", proposalIds)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateProposalsError) {
    console.error(
      "loadProposal.invalidateIndividualProposals.proposals ::",
      invalidateProposalsError,
    );
    return;
  }

  const { error: invalidateCampusError } = await supabase
    .from("campus_load")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "INDIVIDUAL_PROPOSAL_INVALIDATED",
    })
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateCampusError) {
    console.error(
      "loadProposal.invalidateIndividualProposals.campusLoad ::",
      invalidateCampusError,
    );
  }

  revalidateProposalCollectionsByTerm(academicTermId);
  revalidateUniversityCampusWorkspace(academicTermId, campusId);
  for (const proposal of proposals) {
    revalidateFacultyProposalWorkspace(academicTermId, proposal.user_id);
  }
};
