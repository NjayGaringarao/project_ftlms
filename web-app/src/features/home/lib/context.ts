"use server";

import { TermListItem } from "@/features/admin/lib/terms";
import { getDefaultAcademicTermCached } from "@/features/admin/lib/terms-cached";
import { getCurrentUser, getUserRole } from "@/features/auth/lib/utils";
import { getCurrentUserDataCached } from "@/features/profile/lib/user-data/cached";
import { UserRole } from "@/features/shared/types/models";
import { createClient } from "@/utils/supabase/server";
import { resolveHighestRole } from "./ftl-status";
import { DashboardContext, DashboardScope } from "./types";

const resolveDashboardTerm = async (): Promise<TermListItem | null> => {
  const defaultTerm = await getDefaultAcademicTermCached();
  if (defaultTerm) return defaultTerm;

  // No default configured — fall back to the term containing today,
  // mirroring the behavior of the get_user_data RPC.
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("academic_term")
    .select(
      "id, code, academic_year_id, name, start, end, academic_year:academic_year_id (id, code, start_year, end_year)",
    )
    .lte("start", today)
    .gte("end", today)
    .maybeSingle();

  if (error) {
    console.error("lib.home.context.resolveDashboardTerm ::", error);
    return null;
  }

  if (!data) return null;

  const academicYear = Array.isArray(data.academic_year)
    ? data.academic_year[0]
    : data.academic_year;

  return {
    id: data.id,
    code: data.code,
    academic_year_id: data.academic_year_id,
    name: data.name,
    start: data.start,
    end: data.end,
    academic_year: {
      id: academicYear?.id,
      code: academicYear?.code,
      start_year: academicYear?.start_year,
      end_year: academicYear?.end_year,
    },
  };
};

type DesignationScopeRow = {
  job_title: string;
  campus_id: string | null;
  college_id: string | null;
  program_offering_id: string | null;
  program_offering?: {
    campus_id?: string | null;
    program?: { college_id?: string | null } | null;
  } | null;
};

const buildScope = (
  role: UserRole,
  designations: DesignationScopeRow[],
): DashboardScope => {
  const scope: DashboardScope = {
    programOfferingIds: [],
    chairPairs: [],
    collegeIds: [],
    campusIds: [],
  };

  const matching = designations.filter(
    (designation) => designation.job_title === role,
  );

  if (role === "Program Chairperson") {
    matching.forEach((designation) => {
      if (designation.program_offering_id) {
        scope.programOfferingIds.push(designation.program_offering_id);
      }
      const campusId = designation.program_offering?.campus_id ?? null;
      const collegeId = designation.program_offering?.program?.college_id ?? null;
      if (
        campusId &&
        collegeId &&
        !scope.chairPairs.some(
          (pair) => pair.campusId === campusId && pair.collegeId === collegeId,
        )
      ) {
        scope.chairPairs.push({ campusId, collegeId });
      }
    });
  } else if (role === "College Dean") {
    scope.collegeIds = matching
      .map((designation) => designation.college_id)
      .filter((value): value is string => Boolean(value));
  } else if (role === "Campus Director") {
    scope.campusIds = matching
      .map((designation) => designation.campus_id)
      .filter((value): value is string => Boolean(value));
  }

  return scope;
};

const hasRequiredScope = (role: UserRole, scope: DashboardScope): boolean => {
  if (role === "Program Chairperson") return scope.programOfferingIds.length > 0;
  if (role === "College Dean") return scope.collegeIds.length > 0;
  if (role === "Campus Director") return scope.campusIds.length > 0;
  return true;
};

export const getDashboardContext = async (): Promise<DashboardContext | null> => {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const [roles, userData, term] = await Promise.all([
    getUserRole(),
    getCurrentUserDataCached({ includeDesignations: true }),
    resolveDashboardTerm(),
  ]);

  let role = resolveHighestRole(roles);
  const designations = (userData?.designations ?? []) as DesignationScopeRow[];
  let scope = buildScope(role, designations);

  // A leadership role without its scoping designation cannot be charted —
  // fall back to the personal faculty view.
  if (!hasRequiredScope(role, scope)) {
    role = "Faculty";
    scope = buildScope(role, designations);
  }

  return {
    userId: currentUser.id,
    firstName: userData?.identity?.first_name ?? null,
    role,
    term,
    scope,
  };
};
