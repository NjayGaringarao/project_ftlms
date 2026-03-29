import {
  FacultyLoadExportError,
  getFacultyLoadExportDocument,
  type FacultyLoadExportDocument,
} from "@/lib/faculty-load-export/document";
import { MAX_BULK_FACULTY_LOAD_EXPORT_COUNT } from "@/lib/faculty-load-export/constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FacultyLoadBulkExportInput = {
  academicTermId: string;
  facultyIdsParam: string | string[] | null | undefined;
};

export type FacultyLoadBulkExportPayload = {
  facultyIds: string[];
  documents: FacultyLoadExportDocument[];
};

const splitCommaSeparated = (raw: string): string[] =>
  raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const toFacultyIds = (
  value: string | string[] | null | undefined,
): string[] => {
  if (!value) return [];

  const values = Array.isArray(value)
    ? value.flatMap((entry) => splitCommaSeparated(entry))
    : splitCommaSeparated(value);

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const id of values) {
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.push(id);
  }

  return deduped;
};

const assertValidFacultyIds = (facultyIds: string[]) => {
  if (facultyIds.length === 0) {
    throw new FacultyLoadExportError(
      400,
      "At least one faculty ID is required for bulk export.",
    );
  }

  if (facultyIds.length > MAX_BULK_FACULTY_LOAD_EXPORT_COUNT) {
    throw new FacultyLoadExportError(
      400,
      `Bulk export supports up to ${MAX_BULK_FACULTY_LOAD_EXPORT_COUNT} faculty documents per request.`,
    );
  }

  for (const facultyId of facultyIds) {
    if (!UUID_PATTERN.test(facultyId)) {
      throw new FacultyLoadExportError(
        400,
        `Invalid faculty ID provided: ${facultyId}`,
      );
    }
  }
};

export const getFacultyLoadBulkExportPayload = async ({
  academicTermId,
  facultyIdsParam,
}: FacultyLoadBulkExportInput): Promise<FacultyLoadBulkExportPayload> => {
  const facultyIds = toFacultyIds(facultyIdsParam);
  assertValidFacultyIds(facultyIds);

  const documents: FacultyLoadExportDocument[] = [];
  for (const facultyId of facultyIds) {
    const document = await getFacultyLoadExportDocument({
      academicTermId,
      facultyId,
    });
    documents.push(document);
  }

  return {
    facultyIds,
    documents,
  };
};
