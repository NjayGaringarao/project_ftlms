import { createClient } from "@/utils/supabase/server";
import { getUserDataById } from "@/lib/user-data/queries";
import type { UserDataReadModel } from "@/lib/user-data/types";
import type { Degree } from "@/models";
import { calculateLaboratoryContactHours } from "@/lib/course-loading/calculations";

type RawRpcResult = {
  success?: boolean;
  proposal_id?: string | null;
  campus_proposal_id?: string | null;
  campus_id?: string | null;
  reason?: string | null;
};

export type CreateIndividualProposalMode =
  | "ALLOW_RECREATE"
  | "REQUIRE_NO_OR_INVALIDATED";

export type CreateIndividualProposalResult = {
  success: boolean;
  proposalId: string | null;
  campusId: string | null;
  reason: string | null;
};

export type CreateCampusProposalResult = {
  success: boolean;
  campusProposalId: string | null;
  campusId: string | null;
  reason: string | null;
};

const canReadRpcResult = (value: unknown): value is RawRpcResult =>
  typeof value === "object" && value !== null;

const parseRpcResult = (value: unknown): RawRpcResult => {
  const payload = Array.isArray(value) ? value[0] : value;
  if (!canReadRpcResult(payload)) return {};
  return payload;
};

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

export const canCreateProposalFromRoles = (roles: string[]): boolean =>
  roles.includes("Admin") ||
  roles.includes("Program Chairperson") ||
  roles.includes("College Dean");

export const isFinalDecisionStatus = (
  value: string,
): value is "APPROVED" | "REJECTED" =>
  value === "APPROVED" || value === "REJECTED";

const parseCommaSeparatedIds = (rawValue: string): string[] =>
  Array.from(
    new Set(
      rawValue
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

export const parseProposalIds = (rawValue: string): string[] =>
  parseCommaSeparatedIds(rawValue);

export const parseFacultyIds = (rawValue: string): string[] =>
  parseCommaSeparatedIds(rawValue);

export const toCampusDirectorDesignationByCampus = (
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

export const resolveCreatorDesignationId = (
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

export const createIndividualProposalViaRpc = async ({
  academicTermId,
  facultyId,
  currentUserId,
  creatorDesignationId,
  mode,
}: {
  academicTermId: string;
  facultyId: string;
  currentUserId: string;
  creatorDesignationId: string | null;
  mode: CreateIndividualProposalMode;
}): Promise<CreateIndividualProposalResult> => {
  const userData = await getUserDataById(facultyId, {
    academicTermId,
    includeDegrees: true,
    includeDesignations: true,
    includeClasses: true,
    includeLoads: true,
  });

  if (!userData) {
    return {
      success: false,
      proposalId: null,
      campusId: null,
      reason: "FACULTY_NOT_FOUND",
    };
  }

  if (!userData.campus_id) {
    return {
      success: false,
      proposalId: null,
      campusId: null,
      reason: "FACULTY_CAMPUS_MISSING",
    };
  }

  const snapshot = computeProposalSnapshot(userData);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_individual_proposal", {
    p_user_id: facultyId,
    p_campus_id: userData.campus_id,
    p_academic_term_id: academicTermId,
    p_employment_status: snapshot.employment_status,
    p_academic_rank: snapshot.academic_rank,
    p_bachelors_degree: snapshot.bachelors_degree,
    p_masters_degree: snapshot.masters_degree,
    p_doctorate_degree: snapshot.doctorate_degree,
    p_designations: snapshot.designations,
    p_equivalent_teaching_load: snapshot.equivalent_teaching_load,
    p_total_lecture_hours: snapshot.total_lecture_hours,
    p_total_lab_hours: snapshot.total_lab_hours,
    p_preparation_count: snapshot.preparation_count,
    p_actual_teaching_load: snapshot.actual_teaching_load,
    p_advisory_class: snapshot.advisory_class,
    p_created_by_user_id: currentUserId,
    p_created_by_designation_id: creatorDesignationId,
    p_require_latest_no_or_invalidated:
      mode === "REQUIRE_NO_OR_INVALIDATED",
    p_invalidate_current_active_approved: mode === "ALLOW_RECREATE",
  });

  if (error) {
    console.error("proposal.createIndividualProposalViaRpc ::", error);
    return {
      success: false,
      proposalId: null,
      campusId: userData.campus_id,
      reason: "RPC_ERROR",
    };
  }

  const parsed = parseRpcResult(data);
  return {
    success: parsed.success === true,
    proposalId: parsed.proposal_id ?? null,
    campusId: parsed.campus_id ?? userData.campus_id,
    reason: parsed.reason ?? null,
  };
};

export const createCampusProposalViaRpc = async ({
  academicTermId,
  campusId,
  createdByUserId,
  createdByDesignationId,
}: {
  academicTermId: string;
  campusId: string;
  createdByUserId: string;
  createdByDesignationId: string | null;
}): Promise<CreateCampusProposalResult> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_campus_proposal", {
    p_campus_id: campusId,
    p_academic_term_id: academicTermId,
    p_created_by_user_id: createdByUserId,
    p_created_by_designation_id: createdByDesignationId,
  });

  if (error) {
    console.error("proposal.createCampusProposalViaRpc ::", error);
    return {
      success: false,
      campusProposalId: null,
      campusId,
      reason: "RPC_ERROR",
    };
  }

  const parsed = parseRpcResult(data);
  return {
    success: parsed.success === true,
    campusProposalId: parsed.campus_proposal_id ?? null,
    campusId: parsed.campus_id ?? campusId,
    reason: parsed.reason ?? null,
  };
};
