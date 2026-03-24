"use server";

import { getCurrentUser, getUserRole } from "@/lib/auth/utils";
import { getCurrentUserData, getUserDataById } from "@/lib/user-data/queries";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserDataReadModel } from "@/lib/user-data/types";
import type { Degree } from "@/models";
import {
  getEvaluationsByProposal,
  getEvaluationMetadataByCampus,
} from "@/lib/faculty-load/queries";

const canCreateProposalFromRoles = (roles: string[]): boolean =>
  roles.includes("Admin") ||
  roles.includes("Program Chairperson") ||
  roles.includes("College Dean");

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
    (sum, cls) => sum + Number(cls.laboratory_unit ?? 0),
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

const getRoleForLevel = (level: number): string => {
  if (level === 0) return "Campus Director";
  if (level === 1) return "Director for Instruction";
  return "University President";
};

const isApproved = (status?: string | null) => status === "APPROVED";

export const createProposalAction = async (formData: FormData) => {
  const academicTermId = String(formData.get("academicTermId") ?? "");
  const facultyId = String(formData.get("facultyId") ?? "");

  if (!academicTermId || !facultyId) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const roles = await getUserRole();
  if (!canCreateProposalFromRoles(roles)) return;

  const userData = await getUserDataById(facultyId, {
    academicTermId,
    includeDegrees: true,
    includeDesignations: true,
    includeClasses: true,
    includeLoads: true,
  });

  if (!userData) return;

  const snapshot = computeProposalSnapshot(userData);
  const supabase = await createClient();

  const { error: invalidateError } = await supabase
    .from("proposal")
    .update({ is_valid: false })
    .eq("user_id", facultyId)
    .eq("academic_term_id", academicTermId)
    .eq("is_valid", true);

  if (invalidateError) {
    console.error("createProposal.invalidate ::", invalidateError);
    return;
  }

  const { error } = await supabase.from("proposal").insert({
    user_id: facultyId,
    academic_term_id: academicTermId,
    ...snapshot,
  });

  if (error) {
    console.error("createProposal.insert ::", error);
    return;
  }

  revalidatePath(
    `/faculty-teaching-load/${academicTermId}/faculty/${facultyId}`,
  );
};

export const submitEvaluationAction = async (formData: FormData) => {
  const proposalId = String(formData.get("proposalId") ?? "");
  const evaluationMetadataId = String(
    formData.get("evaluationMetadataId") ?? "",
  );
  const status = String(formData.get("status") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!proposalId || !evaluationMetadataId) return;
  if (status !== "APPROVED" && status !== "REJECTED") return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  const supabase = await createClient();
  const { data: proposal, error: proposalError } = await supabase
    .from("proposal")
    .select("id, user_id, academic_term_id, is_valid")
    .eq("id", proposalId)
    .maybeSingle();

  if (proposalError || !proposal || !proposal.is_valid) return;

  const { data: metadata, error: metadataError } = await supabase
    .from("evaluation_metadata")
    .select("id, evaluation_level, campus_code")
    .eq("id", evaluationMetadataId)
    .maybeSingle();

  if (metadataError || !metadata) return;

  const { data: facultyUser } = await supabase
    .from("user")
    .select("campus:campus_id (code)")
    .eq("id", proposal.user_id)
    .maybeSingle();

  const facultyCampusCode = facultyUser?.campus?.code ?? null;

  const metadataList = await getEvaluationMetadataByCampus(facultyCampusCode);
  const evaluationHistory = await getEvaluationsByProposal(proposalId);

  const latestByLevel = new Map<number, string | null>();
  const levelMetadata = new Map<number, string>();

  for (const item of metadataList) {
    levelMetadata.set(item.evaluation_level, item.id);
  }

  for (const evaluation of evaluationHistory) {
    const level = evaluation.evaluation_metadata?.evaluation_level;
    if (level === undefined || level === null) continue;

    if (!latestByLevel.has(level)) {
      latestByLevel.set(level, evaluation.status ?? null);
      continue;
    }

    const existing = latestByLevel.get(level);
    if (existing === null) {
      latestByLevel.set(level, evaluation.status ?? null);
    }
  }

  const orderedLevels = [0, 1, 2];
  const currentLevel = orderedLevels.find((level) => {
    const statusValue = latestByLevel.get(level);
    return !isApproved(statusValue);
  });

  if (currentLevel === undefined) return;

  if (levelMetadata.get(currentLevel) !== evaluationMetadataId) return;

  const expectedRole = getRoleForLevel(currentLevel);
  const currentUserData = await getCurrentUserData({
    includeDesignations: true,
  });

  const matchingDesignation = currentUserData?.designations.find(
    (designation) => {
      if (designation.job_title !== expectedRole) return false;
      if (expectedRole !== "Campus Director") return true;
      return designation.campus?.code === facultyCampusCode;
    },
  );

  if (!matchingDesignation) return;

  const { error } = await supabase.from("evaluation").insert({
    proposal_id: proposalId,
    evaluation_metadata_id: evaluationMetadataId,
    evaluator_user_id: currentUser.id,
    designation_id: matchingDesignation.id,
    status,
    comment: comment.length > 0 ? comment : null,
  });

  if (error) {
    console.error("submitEvaluation.insert ::", error);
    return;
  }

  revalidatePath(
    `/faculty-teaching-load/${proposal.academic_term_id}/faculty/${proposal.user_id}`,
  );
};
