import {
  ASYNC_PDF_MAX_COUNT,
  SYNC_PDF_MAX_COUNT,
} from "@/features/document-export/lib/faculty-load-export/constants";
import {
  FacultyLoadExportError,
  getFacultyLoadExportDocument,
  type FacultyLoadExportDocument,
} from "@/features/document-export/lib/faculty-load-export/document";
import {
  CAMPUS_FILTER_UNASSIGNED,
  COLLEGE_FILTER_UNASSIGNED,
  type FacultyLoadExportScope,
} from "@/features/document-export/lib/faculty-load-export/scope";
import { getFacultyProposalListByTerm, getCampusLoadInsightsBundle } from "@/features/ftl-evaluation/lib/load-proposal/queries";

const dedupeFacultyIds = (facultyIds: string[]): string[] => {
  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const facultyId of facultyIds) {
    if (seen.has(facultyId)) continue;
    seen.add(facultyId);
    deduped.push(facultyId);
  }
  return deduped;
};

const resolveFacultyListScopeFacultyIds = async (
  academicTermId: string,
  scope: Extract<FacultyLoadExportScope, { kind: "faculty_list" }>,
): Promise<string[]> => {
  const rows = await getFacultyProposalListByTerm(academicTermId);
  const normalizedSearchQuery = scope.searchQuery.trim().toLowerCase();

  const filteredRows = rows.filter((row) => {
    if (row.proposal_filter_status !== scope.statusFilter) return false;
    if (
      normalizedSearchQuery.length > 0 &&
      !row.name.toLowerCase().includes(normalizedSearchQuery)
    ) {
      return false;
    }

    if (scope.campusId === CAMPUS_FILTER_UNASSIGNED) {
      if (row.campus_id !== null) return false;
    } else if (scope.campusId && row.campus_id !== scope.campusId) {
      return false;
    }

    if (scope.collegeId === COLLEGE_FILTER_UNASSIGNED) {
      if (row.college_id !== null) return false;
    } else if (scope.collegeId && row.college_id !== scope.collegeId) {
      return false;
    }

    return true;
  });

  const exportableRows = filteredRows.filter(
    (row) =>
      row.proposal_filter_status !== "NO_PROPOSAL" &&
      !!row.latest_faculty_load_proposal_id,
  );

  return dedupeFacultyIds(exportableRows.map((row) => row.id));
};

const resolveCampusInsightsScopeFacultyIds = async (
  academicTermId: string,
  scope: Extract<FacultyLoadExportScope, { kind: "campus_insights" }>,
): Promise<string[]> => {
  const bundle = await getCampusLoadInsightsBundle(scope.campusId, academicTermId);
  const lifecycleByFacultyId = new Map(
    bundle.latestIndividualProposals.map((proposal) => [
      proposal.user_id,
      proposal.lifecycle_status,
    ]),
  );

  const orderedFacultyIds = bundle.etlAtlPerFaculty.map((row) => row.faculty_id);
  const scopedIds = orderedFacultyIds.filter((facultyId) => {
    const lifecycleStatus = lifecycleByFacultyId.get(facultyId);
    if (!lifecycleStatus) return false;
    if (scope.mode === "APPROVED") return lifecycleStatus === "APPROVED";
    return true;
  });

  return dedupeFacultyIds(scopedIds);
};

export const resolveFacultyIdsByExportScope = async ({
  academicTermId,
  scope,
}: {
  academicTermId: string;
  scope: FacultyLoadExportScope;
}): Promise<string[]> => {
  const facultyIds =
    scope.kind === "faculty_list"
      ? await resolveFacultyListScopeFacultyIds(academicTermId, scope)
      : await resolveCampusInsightsScopeFacultyIds(academicTermId, scope);

  if (facultyIds.length === 0) {
    throw new FacultyLoadExportError(
      400,
      "No exportable faculty documents found for this scope.",
    );
  }

  if (facultyIds.length > ASYNC_PDF_MAX_COUNT) {
    throw new FacultyLoadExportError(
      400,
      `Export supports up to ${ASYNC_PDF_MAX_COUNT} faculty documents per request.`,
    );
  }

  return facultyIds;
};

export const resolveFacultyLoadExportDocumentsByScope = async ({
  academicTermId,
  scope,
}: {
  academicTermId: string;
  scope: FacultyLoadExportScope;
}): Promise<{
  facultyIds: string[];
  documents: FacultyLoadExportDocument[];
}> => {
  const facultyIds = await resolveFacultyIdsByExportScope({
    academicTermId,
    scope,
  });

  const documents: FacultyLoadExportDocument[] = [];
  for (const facultyId of facultyIds) {
    const document = await getFacultyLoadExportDocument({
      academicTermId,
      facultyId,
    });
    documents.push(document);
  }

  return { facultyIds, documents };
};

export const assertSyncPdfScopeLimit = (count: number): void => {
  if (count > SYNC_PDF_MAX_COUNT) {
    throw new FacultyLoadExportError(
      409,
      `PDF download supports up to ${SYNC_PDF_MAX_COUNT} documents for synchronous export.`,
    );
  }
};
