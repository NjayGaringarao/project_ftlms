import { UserRole } from "@/features/shared/types/models";
import type {
  CampusCollegeLoadStatus,
  CampusCollegeLoadStep,
} from "@/features/shared/types/models/campus_college_load";

// Highest role wins on /home. get_user_roles() gives no ordering guarantee,
// so precedence is explicit here.
export const ROLE_PRECEDENCE: UserRole[] = [
  "Admin",
  "Vice President for Academic Affairs",
  "Director for Instruction",
  "Campus Director",
  "College Dean",
  "Program Chairperson",
  "Faculty",
];

export const resolveHighestRole = (roles: UserRole[]): UserRole =>
  ROLE_PRECEDENCE.find((role) => roles.includes(role)) ?? "Faculty";

export type FtlStatusVariant = "pending" | "approved" | "returned";

export const getFtlStatusLabel = (
  status: CampusCollegeLoadStatus | null,
  step: CampusCollegeLoadStep | null,
): { label: string; variant: FtlStatusVariant } | null => {
  if (!status) return null;
  if (status === "SUBMITTED") {
    if (step === "CAMPUS_DIRECTOR")
      return { label: "For Approval by Campus Director", variant: "pending" };
    if (step === "DIRECTOR_FOR_INSTRUCTION")
      return { label: "For Approval by DI", variant: "pending" };
    if (step === "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS")
      return { label: "For Approval by VPAA", variant: "pending" };
  }
  if (status === "APPROVED") return { label: "Approved", variant: "approved" };
  if (status === "RETURNED")
    return { label: "Returned for Revision", variant: "returned" };
  if (status === "DRAFT") return { label: "Draft", variant: "pending" };
  return null;
};

export const ftlStatusVariantClass: Record<FtlStatusVariant, string> = {
  pending: "border text-foreground/60",
  approved: "border border-emerald-600 text-emerald-700",
  returned: "border border-amber-500 text-amber-700",
};

export const FTL_STEP_LABEL: Record<CampusCollegeLoadStep, string> = {
  PROGRAM_CHAIR: "Program Chair",
  CAMPUS_DIRECTOR: "Campus Director",
  DIRECTOR_FOR_INSTRUCTION: "Director for Instruction",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
  COMPLETED: "Completed",
};

export const FTL_STEP_SHORT_LABEL: Record<CampusCollegeLoadStep, string> = {
  PROGRAM_CHAIR: "PC",
  CAMPUS_DIRECTOR: "CD",
  DIRECTOR_FOR_INSTRUCTION: "DI",
  VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS: "VPAA",
  COMPLETED: "Done",
};

export const accessLabelForRole = (role: UserRole): string => {
  if (role === "Admin") return "Administrator Access";
  if (role === "Vice President for Academic Affairs") return "VPAA Access";
  if (role === "Director for Instruction") return "DI Access";
  if (role === "Campus Director") return "Campus Director Access";
  if (role === "College Dean") return "Dean Access";
  if (role === "Program Chairperson") return "Program Chair Access";
  return "Faculty Access";
};

export const evaluationStepForRole = (
  role: UserRole,
): CampusCollegeLoadStep | null => {
  if (role === "Campus Director") return "CAMPUS_DIRECTOR";
  if (role === "Director for Instruction") return "DIRECTOR_FOR_INSTRUCTION";
  if (role === "Vice President for Academic Affairs")
    return "VICE_PRESIDENT_FOR_ACADEMIC_AFFAIRS";
  return null;
};
