import { getUserRole } from "@/lib/auth/utils";
import { getTermById } from "@/lib/admin/terms";
import { getLatestProposalByUserTerm } from "@/lib/load-proposal/queries";
import { getFacultyScheduleTermSnapshot } from "@/lib/schedule/faculty-schedule";
import type { FacultyScheduleRow } from "@/lib/schedule/types";
import { getCurrentUserData } from "@/lib/user-data/queries";
import { getUserOverviewById } from "@/lib/user-overview";
import { createClient } from "@/utils/supabase/server";

type FacultyLoadExportInput = {
  academicTermId: string;
  facultyId: string;
};

type FacultyLoadExportSignatorySlot = {
  name: string | null;
  title: string;
};

export type FacultyLoadExportDocument = {
  facultyId: string;
  academicTermId: string;
  termCode: string;
  termDisplayName: string;
  academicYearDisplay: string;
  facultyName: string;
  campusName: string;
  campusAddress: string;
  collegeName: string;
  employmentStatus: string;
  academicRank: string;
  bachelorsDegree: string;
  mastersDegree: string;
  doctorateDegree: string;
  designations: string;
  advisoryClass: string;
  equivalentTeachingLoad: number;
  totalLectureHours: number;
  totalLabHours: number;
  preparationCount: number;
  equivalentPrepUnits: number;
  actualTeachingLoad: number;
  totalWorkingLoad: number;
  excess24: number;
  scheduleRows: FacultyScheduleRow[];
  signatories: {
    preparedBy: FacultyLoadExportSignatorySlot;
    recommendingApproval: FacultyLoadExportSignatorySlot;
    approvedBy: FacultyLoadExportSignatorySlot;
  };
};

type RawDesignationHolder = {
  id?: string | null;
  identity?:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

type RawDesignationRow = {
  id: string;
  job_title: string;
  designated_at: string | null;
  holder?: RawDesignationHolder | RawDesignationHolder[] | null;
};

const PRIVILEGED_EXPORT_ROLES = new Set([
  "Admin",
  "Program Chairperson",
  "College Dean",
]);

const first = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toFixed = (value: number): number => Number(value.toFixed(2));

const toNonEmptyText = (
  value: string | null | undefined,
  fallback = "-",
): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

const toTermDisplayName = (rawTermName: string): string => {
  const normalized = rawTermName.toUpperCase();
  if (normalized === "FIRST SEMESTER") return "1st Semester";
  if (normalized === "SECOND SEMESTER") return "2nd Semester";
  if (normalized === "MIDYEAR") return "Midyear";
  return rawTermName;
};

const resolveDesignationName = (row: RawDesignationRow | null): string | null => {
  if (!row) return null;

  const holder = first(row.holder);
  const identity = holder ? first(holder.identity) : null;
  const name = identity?.name;
  return typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
};

const getLatestSignatoryByTitle = async (
  jobTitle: string,
  campusId?: string | null,
): Promise<string | null> => {
  const supabase = await createClient();

  let query = supabase
    .from("designation")
    .select(
      `
      id,
      job_title,
      designated_at,
      holder:user_id (
        id,
        identity:identity (name)
      )
    `,
    )
    .eq("job_title", jobTitle)
    .order("designated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);

  if (campusId === undefined) {
    // No campus scope filter.
  } else if (campusId === null) {
    query = query.is("campus_id", null);
  } else {
    query = query.eq("campus_id", campusId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("facultyLoadExport.getLatestSignatoryByTitle ::", error);
    return null;
  }

  return resolveDesignationName((data as RawDesignationRow | null) ?? null);
};

const assertCanAccessFacultyLoadExport = async (
  facultyCampusId: string | null,
): Promise<void> => {
  const roles = await getUserRole();

  if (roles.some((role) => PRIVILEGED_EXPORT_ROLES.has(role))) {
    return;
  }

  if (!roles.includes("Campus Director") || !facultyCampusId) {
    throw new FacultyLoadExportError(403, "You are not allowed to export this document.");
  }

  const currentUserData = await getCurrentUserData({ includeDesignations: true });
  const hasMatchingCampusDesignation = (currentUserData?.designations ?? []).some(
    (designation) =>
      designation.job_title === "Campus Director" &&
      designation.campus_id === facultyCampusId,
  );

  if (!hasMatchingCampusDesignation) {
    throw new FacultyLoadExportError(403, "You are not allowed to export this document.");
  }
};

export class FacultyLoadExportError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FacultyLoadExportError";
  }
}

export const isFacultyLoadExportError = (
  value: unknown,
): value is FacultyLoadExportError => value instanceof FacultyLoadExportError;

export const getFacultyLoadExportDocument = async ({
  academicTermId,
  facultyId,
}: FacultyLoadExportInput): Promise<FacultyLoadExportDocument> => {
  const [overview, proposal, term, scheduleSnapshot] = await Promise.all([
    getUserOverviewById(facultyId),
    getLatestProposalByUserTerm(facultyId, academicTermId),
    getTermById(academicTermId),
    getFacultyScheduleTermSnapshot(facultyId, academicTermId),
  ]);

  if (!overview) {
    throw new FacultyLoadExportError(404, "Faculty not found.");
  }

  await assertCanAccessFacultyLoadExport(overview.campus_id);

  if (!term) {
    throw new FacultyLoadExportError(404, "Academic term not found.");
  }

  if (!proposal) {
    throw new FacultyLoadExportError(404, "No proposal found for this faculty and term.");
  }

  const [preparedByName, recommendingApprovalName, approvedByName] =
    await Promise.all([
      getLatestSignatoryByTitle("Campus Director", overview.campus_id),
      getLatestSignatoryByTitle("Director for Instruction", null),
      getLatestSignatoryByTitle("Vice President for Academic Affairs", null),
    ]);

  const equivalentTeachingLoad = toFixed(toNumber(proposal.equivalent_teaching_load));
  const totalLectureHours = toFixed(toNumber(proposal.total_lecture_hours));
  const totalLabHours = toFixed(toNumber(proposal.total_lab_hours));
  const preparationCount = Math.max(0, Math.round(toNumber(proposal.preparation_count)));
  const equivalentPrepUnits = toFixed(preparationCount * 0.5);
  const actualTeachingLoad = toFixed(toNumber(proposal.actual_teaching_load));
  const totalWorkingLoad = toFixed(equivalentTeachingLoad + actualTeachingLoad);
  const excess24 = toFixed(Math.max(totalWorkingLoad - 24, 0));

  return {
    facultyId,
    academicTermId,
    termCode: term.code,
    termDisplayName: toTermDisplayName(term.name),
    academicYearDisplay: `${term.academic_year.start_year}-${term.academic_year.end_year}`,
    facultyName: toNonEmptyText(overview.identity?.name, "Unknown Faculty"),
    campusName: toNonEmptyText(overview.campus?.name),
    campusAddress: toNonEmptyText(overview.campus?.address),
    collegeName: toNonEmptyText(overview.college?.name),
    employmentStatus: toNonEmptyText(proposal.employment_status),
    academicRank: toNonEmptyText(proposal.academic_rank),
    bachelorsDegree: toNonEmptyText(proposal.bachelors_degree),
    mastersDegree: toNonEmptyText(proposal.masters_degree),
    doctorateDegree: toNonEmptyText(proposal.doctorate_degree),
    designations: toNonEmptyText(proposal.designations),
    advisoryClass: toNonEmptyText(proposal.advisory_class),
    equivalentTeachingLoad,
    totalLectureHours,
    totalLabHours,
    preparationCount,
    equivalentPrepUnits,
    actualTeachingLoad,
    totalWorkingLoad,
    excess24,
    scheduleRows: scheduleSnapshot.schedule_rows,
    signatories: {
      preparedBy: {
        name: preparedByName,
        title: "Campus Director",
      },
      recommendingApproval: {
        name: recommendingApprovalName,
        title: "Director for Instruction",
      },
      approvedBy: {
        name: approvedByName,
        title: "Vice President for Academic Affairs",
      },
    },
  };
};
