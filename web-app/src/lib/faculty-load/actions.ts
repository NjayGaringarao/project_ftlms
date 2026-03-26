"use server";

import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData, getUserDataById } from "@/lib/user-data/queries";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserDataReadModel } from "@/lib/user-data/types";
import type { CampusProposalStep, Degree } from "@/models";
import { calculateLaboratoryContactHours } from "@/lib/course-loading/calculations";

const canCreateProposalFromRoles = (roles: string[]): boolean =>
  roles.includes("Admin") ||
  roles.includes("Program Chairperson") ||
  roles.includes("College Dean");

const isFinalDecisionStatus = (
  value: string,
): value is "APPROVED" | "REJECTED" =>
  value === "APPROVED" || value === "REJECTED";

const parseProposalIds = (rawValue: string): string[] =>
  Array.from(
    new Set(
      rawValue
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

const parseFacultyIds = (rawValue: string): string[] =>
  Array.from(
    new Set(
      rawValue
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

const toCampusDirectorDesignationByCampus = (
  designations: Array<{
    id: string;
    job_title: string;
    campus_id: string | null;
  }>,
) =>
  new Map(
    designations
      .filter(
        (designation) =>
          designation.job_title === "Campus Director" && designation.campus_id,
      )
      .map((designation) => [designation.campus_id as string, designation.id]),
  );

const pickDegreeTitle = (
  degrees: Degree[],
  level: string,
): string | null => {
  const matches = degrees.filter((degree) => degree.academic_level === level);
  if (matches.length === 0) return null;

  const sorted = [...matches].sort((a, b) => {
    const yearDiff = (b.year_graduated ?? 0) - (a.year_graduated ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });

  return sorted[0]?.title ?? null;
};

const computeProposalSnapshot = (userData: UserDataReadModel) => {
  const lectureSum = userData.classes.reduce(
    (sum, cls) => sum + Number(cls.lecture_unit ?? 0),
    0,
  );
  const labSum = userData.classes.reduce(
    (sum, cls) =>
      sum + calculateLaboratoryContactHours(Number(cls.laboratory_unit ?? 0)),
    0,
  );

  const preparationCount = new Set(
    userData.classes.map((cls) => cls.course_code).filter(Boolean),
  ).size;

  const designations = userData.designations
    .map((designation) => designation.job_title)
    .filter(Boolean)
    .join(", ");

  return {
    employment_status: userData.employmentStatus,
    academic_rank: userData.rank?.title ?? null,
    bachelors_degree: pickDegreeTitle(userData.degrees, "Bachelor's Degree"),
    masters_degree: pickDegreeTitle(userData.degrees, "Master's Degree"),
    doctorate_degree: pickDegreeTitle(userData.degrees, "Doctorate Degree"),
    designations: designations.length > 0 ? designations : null,
    equivalent_teaching_load: userData.designationLoad,
    total_lecture_hours: lectureSum,
    total_lab_hours: labSum,
    preparation_count: preparationCount,
    actual_teaching_load: userData.actualTeachingLoad,
    advisory_class: null,
  };
};

const resolveCreatorDesignationId = (
  designations: Array<{ id: string; job_title: string }>,
): string | null => {
  const preferred = designations.find((designation) =>
    [
      "Program Chairperson",
      "College Dean",
      "Campus Director",
      "Director for Instruction",
      "Vice President for Academic Affairs",
    ].includes(designation.job_title),
  );

  return preferred?.id ?? null;
};

type CreateProposalOptions = {
  academicTermId: string;
  facultyId: string;
  currentUserId: string;
  creatorDesignationId: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  allowExistingProposals: boolean;
};

type CreateProposalResult =
  | { success: true; facultyId: string; campusId: string }
  | { success: false };

const createIndividualProposalForFaculty = async ({
  academicTermId,
  facultyId,
  currentUserId,
  creatorDesignationId,
  supabase,
  allowExistingProposals,
}: CreateProposalOptions): Promise<CreateProposalResult> => {
  const userData = await getUserDataById(facultyId, {
    academicTermId,
    includeDegrees: true,
    includeDesignations: true,
    includeClasses: true,
    includeLoads: true,
  });

  if (!userData) return { success: false };
  if (!userData.campus_id) {
    console.error("createProposalAction :: faculty campus is missing");
    return { success: false };
  }

  if (!allowExistingProposals) {
    const { data: existingProposal, error: existingProposalError } = await supabase
      .from("proposal")
      .select("id")
      .eq("user_id", facultyId)
      .eq("academic_term_id", academicTermId)
      .limit(1)
      .maybeSingle();

    if (existingProposalError) {
      console.error(
        "createProposal.checkExistingProposal ::",
        existingProposalError,
      );
      return { success: false };
    }

    if (existingProposal?.id) {
      return { success: false };
    }
  } else {
    const { error: invalidateCurrentError } = await supabase
      .from("proposal")
      .update({
        lifecycle_status: "INVALIDATED",
        invalidated_reason: "RECREATED_BY_NEW_PROPOSAL",
      })
      .eq("user_id", facultyId)
      .eq("academic_term_id", academicTermId)
      .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

    if (invalidateCurrentError) {
      console.error(
        "createProposal.invalidateCurrent ::",
        invalidateCurrentError,
      );
      return { success: false };
    }
  }

  const snapshot = computeProposalSnapshot(userData);

  const { error: insertError } = await supabase.from("proposal").insert({
    user_id: facultyId,
    campus_id: userData.campus_id,
    academic_term_id: academicTermId,
    lifecycle_status: "ACTIVE",
    invalidated_reason: null,
    created_by_user_id: currentUserId,
    created_by_designation_id: creatorDesignationId,
    ...snapshot,
  });

  if (insertError) {
    console.error("createProposal.insert ::", insertError);
    return { success: false };
  }

  const { error: invalidateCampusProposalError } = await supabase
    .from("campus_proposal")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "INDIVIDUAL_PROPOSAL_CREATED",
    })
    .eq("campus_id", userData.campus_id)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateCampusProposalError) {
    console.error(
      "createProposal.invalidateCampusProposal ::",
      invalidateCampusProposalError,
    );
  }

  return {
    success: true,
    facultyId,
    campusId: userData.campus_id,
  };
};

export const createProposalAction = async (formData: FormData) => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const facultyId = String(formData.get("facultyId") ?? "");

  if (!academicTermId || !facultyId) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const roles = await getUserRole();
  if (!canCreateProposalFromRoles(roles)) return;

  const [currentUserData, supabase] = await Promise.all([
    getCurrentUserData({ includeDesignations: true }),
    createClient(),
  ]);
  const creatorDesignationId = resolveCreatorDesignationId(
    currentUserData?.designations ?? [],
  );

  const result = await createIndividualProposalForFaculty({
    academicTermId,
    facultyId,
    currentUserId: currentUser.id,
    creatorDesignationId,
    supabase,
    allowExistingProposals: true,
  });

  if (!result.success) {
    return;
  }

  revalidatePath(
    `/faculty-teaching-load/${academicTermId}/${facultyId}`,
  );
  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${facultyId}`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${result.campusId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}`);
};

export const submitEvaluationAction = async (formData: FormData) => {
  const proposalId = String(formData.get("proposalId") ?? "");
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!proposalId || !isFinalDecisionStatus(status)) return;
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
    .from("proposal")
    .select("id, user_id, campus_id, academic_term_id, lifecycle_status")
    .eq("id", proposalId)
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
    .from("individual_proposal_evaluation")
    .select("id")
    .eq("proposal_id", proposalId)
    .eq("step", "CAMPUS_DIRECTOR")
    .maybeSingle();

  if (existingEvaluation?.id) return;

  const designationId = designationByCampus.get(proposal.campus_id);
  if (!designationId) return;

  const { error: insertError } = await supabase
    .from("individual_proposal_evaluation")
    .insert({
      proposal_id: proposalId,
      step: "CAMPUS_DIRECTOR",
      evaluator_user_id: currentUser.id,
      designation_id: designationId,
      status,
      comment: comment.length > 0 ? comment : null,
    });

  if (insertError) {
    console.error("submitEvaluation.insert ::", insertError);
    return;
  }

  revalidatePath(
    `/faculty-teaching-load/${proposal.academic_term_id}/${proposal.user_id}`,
  );
  revalidatePath(`/faculty-teaching-load/${proposal.academic_term_id}`);
  revalidatePath(
    `/ftl-evaluation/${proposal.academic_term_id}/campus-load/faculty-load/${proposal.user_id}`,
  );
  revalidatePath(
    `/ftl-evaluation/${proposal.academic_term_id}/campus-load/faculty-load`,
  );
  revalidatePath(
    `/ftl-evaluation/${proposal.academic_term_id}/campus-load/campus-proposal-control`,
  );
};

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
    .from("proposal")
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

  const { data: existingEvaluations, error: existingEvaluationError } = await supabase
    .from("individual_proposal_evaluation")
    .select("proposal_id")
    .in(
      "proposal_id",
      candidateProposals.map((proposal) => proposal.id),
    )
    .eq("step", "CAMPUS_DIRECTOR");

  if (existingEvaluationError) {
    console.error(
      "submitBulkEvaluation.existingEvaluations ::",
      existingEvaluationError,
    );
    return { success: false, processed: 0 };
  }

  const evaluatedProposalIds = new Set(
    (existingEvaluations ?? [])
      .map((row) => row.proposal_id)
      .filter((value): value is string => typeof value === "string"),
  );

  const acceptedProposals = candidateProposals.filter(
    (proposal) => !evaluatedProposalIds.has(proposal.id),
  );

  if (acceptedProposals.length === 0) {
    return { success: false, processed: 0 };
  }

  const successfullyEvaluated = new Array<{
    id: string;
    user_id: string;
    campus_id: string;
  }>();

  for (const proposal of acceptedProposals) {
    if (!proposal.campus_id) continue;
    const designationId = designationByCampus.get(proposal.campus_id);
    if (!designationId) continue;

    const { error: insertError } = await supabase
      .from("individual_proposal_evaluation")
      .insert({
        proposal_id: proposal.id,
        step: "CAMPUS_DIRECTOR",
        evaluator_user_id: currentUser.id,
        designation_id: designationId,
        status,
        comment: comment.length > 0 ? comment : null,
      });

    if (insertError) {
      console.error("submitBulkEvaluation.insert ::", {
        proposalId: proposal.id,
        error: insertError,
      });
      continue;
    }

    successfullyEvaluated.push({
      id: proposal.id,
      user_id: proposal.user_id,
      campus_id: proposal.campus_id,
    });
  }

  if (successfullyEvaluated.length === 0) {
    return { success: false, processed: 0 };
  }

  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);

  const campusIds = Array.from(
    new Set(successfullyEvaluated.map((proposal) => proposal.campus_id)),
  );
  for (const campusId of campusIds) {
    revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${campusId}`);
  }

  for (const proposal of successfullyEvaluated) {
    revalidatePath(`/faculty-teaching-load/${academicTermId}/${proposal.user_id}`);
    revalidatePath(
      `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${proposal.user_id}`,
    );
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

  const [currentUserData, supabase] = await Promise.all([
    getCurrentUserData({ includeDesignations: true }),
    createClient(),
  ]);

  const creatorDesignationId = resolveCreatorDesignationId(
    currentUserData?.designations ?? [],
  );

  const { data: selectedFacultyProposalRows, error: selectedFacultyProposalError } =
    await supabase
      .from("proposal")
      .select("user_id, lifecycle_status, created_at")
      .eq("academic_term_id", academicTermId)
      .in("user_id", facultyIds)
      .order("created_at", { ascending: false });

  if (selectedFacultyProposalError) {
    console.error(
      "submitBulkCreateProposalAction.selectedFacultyProposalRows ::",
      selectedFacultyProposalError,
    );
    return { success: false, processed: 0, skipped: facultyIds.length };
  }

  const latestProposalStatusByFaculty = new Map<string, string>();
  for (const row of selectedFacultyProposalRows ?? []) {
    if (!row.user_id || latestProposalStatusByFaculty.has(row.user_id)) continue;
    latestProposalStatusByFaculty.set(row.user_id, row.lifecycle_status);
  }

  let processed = 0;
  let skipped = 0;
  const successfulFacultyIds = new Set<string>();
  const successfulCampusIds = new Set<string>();

  for (const facultyId of facultyIds) {
    const latestProposalStatus = latestProposalStatusByFaculty.get(facultyId) ?? null;
    const isEligible =
      latestProposalStatus === null || latestProposalStatus === "INVALIDATED";
    if (!isEligible) {
      skipped += 1;
      continue;
    }

    const result = await createIndividualProposalForFaculty({
      academicTermId,
      facultyId,
      currentUserId: currentUser.id,
      creatorDesignationId,
      supabase,
      allowExistingProposals: true,
    });

    if (!result.success) {
      skipped += 1;
      continue;
    }

    processed += 1;
    successfulFacultyIds.add(result.facultyId);
    successfulCampusIds.add(result.campusId);
  }

  if (processed === 0) {
    return { success: false, processed: 0, skipped };
  }

  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);
  revalidatePath(`/ftl-evaluation/${academicTermId}`);

  for (const facultyId of successfulFacultyIds) {
    revalidatePath(`/faculty-teaching-load/${academicTermId}/${facultyId}`);
    revalidatePath(
      `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${facultyId}`,
    );
  }

  for (const campusId of successfulCampusIds) {
    revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${campusId}`);
  }

  return { success: true, processed, skipped };
};

export const createCampusProposalAction = async (formData: FormData) => {
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

  const supabase = await createClient();
  const { data: currentProposals, error: currentProposalsError } = await supabase
    .from("proposal")
    .select(
      `
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
      equivalent_teaching_load,
      total_lecture_hours,
      total_lab_hours,
      preparation_count,
      actual_teaching_load,
      advisory_class,
      lifecycle_status,
      created_at
    `,
    )
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (currentProposalsError) {
    console.error("createCampusProposal.currentProposals ::", currentProposalsError);
    return;
  }

  const proposals = currentProposals ?? [];
  const hasActive = proposals.some((proposal) => proposal.lifecycle_status === "ACTIVE");
  const approvedProposals = proposals.filter(
    (proposal) => proposal.lifecycle_status === "APPROVED",
  );

  if (hasActive || approvedProposals.length === 0) return;

  const { error: invalidateError } = await supabase
    .from("campus_proposal")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "RECREATED_BY_CAMPUS_DIRECTOR",
    })
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateError) {
    console.error("createCampusProposal.invalidateCurrent ::", invalidateError);
    return;
  }

  const { data: createdCampusProposal, error: insertCampusError } = await supabase
    .from("campus_proposal")
    .insert({
      campus_id: campusId,
      academic_term_id: academicTermId,
      lifecycle_status: "ACTIVE",
      invalidated_reason: null,
      created_by_user_id: currentUser.id,
      created_by_designation_id: campusDirectorDesignation.id,
    })
    .select("id")
    .maybeSingle();

  if (insertCampusError || !createdCampusProposal) {
    console.error("createCampusProposal.insert ::", insertCampusError);
    return;
  }

  const membersToInsert = approvedProposals.map((proposal) => ({
    campus_proposal_id: createdCampusProposal.id,
    source_proposal_id: proposal.id,
    proposal_user_id: proposal.user_id,
    employment_status: proposal.employment_status,
    academic_rank: proposal.academic_rank,
    bachelors_degree: proposal.bachelors_degree,
    masters_degree: proposal.masters_degree,
    doctorate_degree: proposal.doctorate_degree,
    designations: proposal.designations,
    equivalent_teaching_load: proposal.equivalent_teaching_load,
    total_lecture_hours: proposal.total_lecture_hours,
    total_lab_hours: proposal.total_lab_hours,
    preparation_count: proposal.preparation_count,
    actual_teaching_load: proposal.actual_teaching_load,
    advisory_class: proposal.advisory_class,
    source_proposal_lifecycle_status: proposal.lifecycle_status,
    source_proposal_created_at: proposal.created_at,
  }));

  const { error: membersError } = await supabase
    .from("campus_proposal_member")
    .insert(membersToInsert);

  if (membersError) {
    console.error("createCampusProposal.members ::", membersError);
    return;
  }

  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${campusId}`);
};

export const submitCampusProposalEvaluationAction = async (
  formData: FormData,
) => {
  const campusProposalId = String(formData.get("campusProposalId") ?? "");
  const step = String(formData.get("step") ?? "") as CampusProposalStep;
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!campusProposalId || !isFinalDecisionStatus(status)) return;
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
  const { data: campusProposal } = await supabase
    .from("campus_proposal")
    .select("id, campus_id, academic_term_id, lifecycle_status")
    .eq("id", campusProposalId)
    .maybeSingle();

  if (!campusProposal || campusProposal.lifecycle_status !== "ACTIVE") return;

  const { data: existingStep } = await supabase
    .from("campus_proposal_evaluation")
    .select("id")
    .eq("campus_proposal_id", campusProposalId)
    .eq("step", step)
    .maybeSingle();

  if (existingStep?.id) return;

  if (step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS") {
    const { data: dfiRow } = await supabase
      .from("campus_proposal_evaluation")
      .select("id, status")
      .eq("campus_proposal_id", campusProposalId)
      .eq("step", "DIRECTOR_FOR_INSTRUCTION")
      .maybeSingle();

    if (!dfiRow || dfiRow.status !== "APPROVED") return;
  }

  const { error: insertError } = await supabase
    .from("campus_proposal_evaluation")
    .insert({
      campus_proposal_id: campusProposalId,
      step,
      evaluator_user_id: currentUser.id,
      designation_id: matchingDesignation.id,
      status,
      comment: comment.length > 0 ? comment : null,
    });

  if (insertError) {
    console.error("submitCampusProposalEvaluation.insert ::", insertError);
    return;
  }

  revalidatePath(`/faculty-teaching-load/${campusProposal.academic_term_id}`);
  revalidatePath(
    `/ftl-evaluation/${campusProposal.academic_term_id}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${campusProposal.academic_term_id}/university-load`);
  revalidatePath(
    `/ftl-evaluation/${campusProposal.academic_term_id}/university-load/${campusProposal.campus_id}`,
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
    .from("proposal")
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
    .from("proposal")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "MANUAL_CAMPUS_DIRECTOR_INVALIDATION",
    })
    .in("id", proposalIds)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateProposalsError) {
    console.error(
      "invalidateIndividualProposals.proposals ::",
      invalidateProposalsError,
    );
    return;
  }

  const { error: invalidateCampusError } = await supabase
    .from("campus_proposal")
    .update({
      lifecycle_status: "INVALIDATED",
      invalidated_reason: "INDIVIDUAL_PROPOSAL_INVALIDATED",
    })
    .eq("campus_id", campusId)
    .eq("academic_term_id", academicTermId)
    .in("lifecycle_status", ["ACTIVE", "APPROVED"]);

  if (invalidateCampusError) {
    console.error(
      "invalidateIndividualProposals.campusProposal ::",
      invalidateCampusError,
    );
  }

  revalidatePath(`/faculty-teaching-load/${academicTermId}`);
  revalidatePath(`/ftl-evaluation/${academicTermId}/campus-load/faculty-load`);
  revalidatePath(
    `/ftl-evaluation/${academicTermId}/campus-load/campus-proposal-control`,
  );
  revalidatePath(`/ftl-evaluation/${academicTermId}/university-load`);
  if (campusId) {
    revalidatePath(`/ftl-evaluation/${academicTermId}/university-load/${campusId}`);
  }
  for (const proposal of proposals) {
    revalidatePath(
      `/ftl-evaluation/${academicTermId}/campus-load/faculty-load/${proposal.user_id}`,
    );
  }
};
