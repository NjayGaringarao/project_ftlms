import type { ProposalStatusFilter } from "@/features/ftl-evaluation/lib/load-proposal/types";

export type FacultyListExportScope = {
  kind: "faculty_list";
  statusFilter: ProposalStatusFilter;
  searchQuery: string;
  campusId: string | null;
  collegeId: string | null;
};

export type CampusInsightsFilterMode = "APPROVED" | "ALL";

export type CampusInsightsExportScope = {
  kind: "campus_insights";
  campusId: string;
  mode: CampusInsightsFilterMode;
};

export type FacultyLoadExportScope =
  | FacultyListExportScope
  | CampusInsightsExportScope;

export const CAMPUS_FILTER_UNASSIGNED = "__UNASSIGNED_CAMPUS__";
export const COLLEGE_FILTER_UNASSIGNED = "__UNASSIGNED_COLLEGE__";

const STATUS_FILTER_VALUES = new Set<ProposalStatusFilter>([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "INVALIDATED",
  "NO_PROPOSAL",
]);

const CAMPUS_INSIGHTS_MODE_VALUES = new Set<CampusInsightsFilterMode>([
  "APPROVED",
  "ALL",
]);

type ScopeQueryValue = string | string[] | null | undefined;

const firstQueryValue = (value: ScopeQueryValue): string => {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
};

const normalizeOptionalFilter = (
  value: string | null | undefined,
): string | null => {
  const normalized = value?.trim();
  if (!normalized) return null;
  return normalized;
};

const toScopeParseError = (message: string): Error => {
  const error = new Error(message);
  error.name = "FacultyLoadExportScopeParseError";
  return error;
};

const parseFacultyListStatusFilter = (value: string): ProposalStatusFilter => {
  if (STATUS_FILTER_VALUES.has(value as ProposalStatusFilter)) {
    return value as ProposalStatusFilter;
  }

  throw toScopeParseError(`Invalid list status filter: ${value || "(empty)"}`);
};

const parseCampusInsightsMode = (value: string): CampusInsightsFilterMode => {
  if (CAMPUS_INSIGHTS_MODE_VALUES.has(value as CampusInsightsFilterMode)) {
    return value as CampusInsightsFilterMode;
  }

  throw toScopeParseError(`Invalid campus insights mode: ${value || "(empty)"}`);
};

export const parseFacultyLoadExportScope = (input: {
  scopeKind?: ScopeQueryValue;
  statusFilter?: ScopeQueryValue;
  searchQuery?: ScopeQueryValue;
  campusId?: ScopeQueryValue;
  collegeId?: ScopeQueryValue;
  mode?: ScopeQueryValue;
}): FacultyLoadExportScope => {
  const scopeKind = firstQueryValue(input.scopeKind);

  if (scopeKind === "faculty_list") {
    return {
      kind: "faculty_list",
      statusFilter: parseFacultyListStatusFilter(
        firstQueryValue(input.statusFilter),
      ),
      searchQuery: firstQueryValue(input.searchQuery).trim(),
      campusId: normalizeOptionalFilter(firstQueryValue(input.campusId)),
      collegeId: normalizeOptionalFilter(firstQueryValue(input.collegeId)),
    };
  }

  if (scopeKind === "campus_insights") {
    const campusId = normalizeOptionalFilter(firstQueryValue(input.campusId));
    if (!campusId) {
      throw toScopeParseError("Campus insights scope requires campusId.");
    }

    return {
      kind: "campus_insights",
      campusId,
      mode: parseCampusInsightsMode(firstQueryValue(input.mode)),
    };
  }

  throw toScopeParseError(`Invalid export scope kind: ${scopeKind || "(empty)"}`);
};

export const parseFacultyLoadExportScopeFromSearchParams = (
  searchParams: URLSearchParams,
): FacultyLoadExportScope => {
  return parseFacultyLoadExportScope({
    scopeKind: searchParams.get("scopeKind"),
    statusFilter: searchParams.get("statusFilter"),
    searchQuery: searchParams.get("searchQuery"),
    campusId: searchParams.get("campusId"),
    collegeId: searchParams.get("collegeId"),
    mode: searchParams.get("mode"),
  });
};

export const parseFacultyLoadExportScopeFromBody = (
  payload: unknown,
): FacultyLoadExportScope => {
  if (!payload || typeof payload !== "object") {
    throw toScopeParseError("Invalid export scope payload.");
  }

  const row = payload as Record<string, unknown>;
  return parseFacultyLoadExportScope({
    scopeKind: (row.scopeKind as ScopeQueryValue) ?? (row.kind as ScopeQueryValue),
    statusFilter: row.statusFilter as ScopeQueryValue,
    searchQuery: row.searchQuery as ScopeQueryValue,
    campusId: row.campusId as ScopeQueryValue,
    collegeId: row.collegeId as ScopeQueryValue,
    mode: row.mode as ScopeQueryValue,
  });
};

export const toFacultyLoadExportScopeSearchParams = (
  scope: FacultyLoadExportScope,
): URLSearchParams => {
  const searchParams = new URLSearchParams();
  searchParams.set("scopeKind", scope.kind);

  if (scope.kind === "faculty_list") {
    searchParams.set("statusFilter", scope.statusFilter);
    searchParams.set("searchQuery", scope.searchQuery);
    if (scope.campusId) searchParams.set("campusId", scope.campusId);
    if (scope.collegeId) searchParams.set("collegeId", scope.collegeId);
    return searchParams;
  }

  searchParams.set("campusId", scope.campusId);
  searchParams.set("mode", scope.mode);
  return searchParams;
};
