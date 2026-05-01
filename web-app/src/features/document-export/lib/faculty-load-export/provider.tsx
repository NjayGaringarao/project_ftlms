import FacultyLoadPrintDocument from "@/features/ftl-evaluation/components/faculty-load/faculty-load-print-document";
import { getTermById } from "@/features/admin/lib/terms";
import type { DocumentExportProvider } from "@/features/document-export/lib/document-export/provider";
import {
  FacultyLoadExportError,
  getFacultyLoadExportDocument,
  type FacultyLoadExportDocument,
} from "@/features/document-export/lib/faculty-load-export/document";
import {
  parseFacultyLoadExportScopeFromBody,
  parseFacultyLoadExportScopeFromSearchParams,
  toFacultyLoadExportScopeSearchParams,
  type FacultyLoadExportScope,
} from "@/features/document-export/lib/faculty-load-export/scope";
import { resolveFacultyIdsByExportScope } from "@/features/document-export/lib/faculty-load-export/scope-resolver";

const sanitizeFilePart = (value: string): string => {
  const normalized = value.trim().replace(/\s+/g, "_");
  const sanitized = normalized.replace(/[^a-zA-Z0-9_-]/g, "");
  return sanitized.length > 0 ? sanitized : "document";
};

const toScope = (scope: unknown): FacultyLoadExportScope => {
  if (!scope || typeof scope !== "object") {
    throw new FacultyLoadExportError(400, "Invalid faculty load export scope.");
  }

  return scope as FacultyLoadExportScope;
};

export const facultyLoadDocumentExportProvider: DocumentExportProvider = {
  documentType: "faculty_load",
  parseScopeFromSearchParams(searchParams) {
    return parseFacultyLoadExportScopeFromSearchParams(searchParams);
  },
  parseScopeFromBody(payload) {
    return parseFacultyLoadExportScopeFromBody(payload);
  },
  toScopeSearchParams(scope) {
    return toFacultyLoadExportScopeSearchParams(toScope(scope));
  },
  async resolveEntityIdsByScope({ academicTermId, scope }) {
    return resolveFacultyIdsByExportScope({
      academicTermId,
      scope: toScope(scope),
    });
  },
  async loadSingleDocument({ academicTermId, entityId }) {
    return getFacultyLoadExportDocument({
      academicTermId,
      facultyId: entityId,
    });
  },
  async loadDocumentsByEntityIds({ academicTermId, entityIds }) {
    const documents: FacultyLoadExportDocument[] = [];
    for (const facultyId of entityIds) {
      const document = await getFacultyLoadExportDocument({
        academicTermId,
        facultyId,
      });
      documents.push(document);
    }
    return documents;
  },
  renderDocument(document) {
    return (
      <FacultyLoadPrintDocument
        document={document as FacultyLoadExportDocument}
      />
    );
  },
  buildSingleFileName(document) {
    const row = document as FacultyLoadExportDocument;
    return `FTL_${sanitizeFilePart(row.facultyName)}_${sanitizeFilePart(row.termCode)}.pdf`;
  },
  async buildScopeFileName({ academicTermId, entityCount }) {
    const term = await getTermById(academicTermId);
    return `FTL_SCOPE_${sanitizeFilePart(term?.code ?? "TERM")}_${entityCount}.pdf`;
  },
};
